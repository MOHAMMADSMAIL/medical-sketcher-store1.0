import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { createPaymentProvider, PaymentProvider } from './payment.provider';

@Injectable()
export class PaymentService {
  private readonly provider: PaymentProvider = createPaymentProvider();
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: { payments: true, user: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'PAID') throw new BadRequestException('Order already paid');
    const existing = order.payments.find((p) => p.status === 'CREATED' && p.checkoutId);
    if (existing) return existing;
    const payment = await this.prisma.payment.create({ data: { orderId, amount: order.total, provider: process.env.PAYMENT_PROVIDER || 'development', idempotencyKey: `order:${orderId}` }, include: { order: true } });
    const checkout = await this.provider.createCheckout({ orderId, amount: Number(order.total), currency: order.currency, email: order.user.email });
    return this.prisma.payment.update({ where: { id: payment.id }, data: { provider: checkout.provider, checkoutId: checkout.checkoutId, status: checkout.status === 'FAILED' ? 'FAILED' : 'CREATED' } });
  }

  async confirm(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, order: { userId } }, include: { order: { include: { items: true } } } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (!payment.checkoutId) throw new BadRequestException('Payment checkout is not initialized');
    return this.applyResult(payment.id, await this.provider.verifyCheckout(payment.checkoutId));
  }

  async webhook(body: { paymentId?: string; checkoutId?: string; eventId?: string }) {
    const payment = await this.prisma.payment.findFirst({ where: body.paymentId ? { id: body.paymentId } : { checkoutId: body.checkoutId } , include: { order: { include: { items: true } } } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (!payment.checkoutId) return payment;
    return this.applyResult(payment.id, await this.provider.verifyCheckout(payment.checkoutId));
  }

  private async applyResult(paymentId: string, result: { status: 'SUCCEEDED' | 'FAILED'; transactionId?: string; resultCode: string; resultDescription?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({ where: { id: paymentId }, data: { status: result.status, transactionId: result.transactionId, resultCode: result.resultCode, resultDescription: result.resultDescription, paidAt: result.status === 'SUCCEEDED' ? new Date() : undefined }, include: { order: { include: { items: true } } } });
      if (result.status === 'SUCCEEDED') {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID', paidAt: new Date() } });
        for (const item of payment.order.items) await tx.downloadPermission.upsert({ where: { userId_productId: { userId: payment.order.userId, productId: item.productId } }, update: { orderId: payment.orderId }, create: { userId: payment.order.userId, productId: item.productId, orderId: payment.orderId } });
      } else await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PENDING' } });
      return payment;
    });
  }
}
