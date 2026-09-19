import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { createEmailProvider, EmailProvider } from './email.provider';
@Injectable()
export class OrdersService {
  private readonly email: EmailProvider = createEmailProvider();
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string) { const cart = await this.prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } }); if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty'); const total = cart.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0); const order = await this.prisma.order.create({ data: { userId, total, currency: 'USD', items: { create: cart.items.map(i => ({ productId: i.productId, price: i.product.price, quantity: i.quantity })) } }, include: { items: { include: { product: true } }, user: true } }); await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }); await this.email.send({ to: order.user.email, template: 'order-confirmation', variables: { orderId: order.id } }); return order; }
  list(userId: string) { return this.prisma.order.findMany({ where: { userId }, include: { items: { include: { product: true } }, payments: true }, orderBy: { createdAt: 'desc' } }); }
  async get(userId: string, id: string) { const order = await this.prisma.order.findFirst({ where: { id, userId }, include: { items: { include: { product: true } }, payments: true } }); if (!order) throw new NotFoundException('Order not found'); return order; }
}
