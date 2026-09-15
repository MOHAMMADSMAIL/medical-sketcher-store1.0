import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string) { const cart = await this.prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } }); if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty'); const total = cart.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0); const order = await this.prisma.order.create({ data: { userId, total, currency: 'USD', items: { create: cart.items.map(i => ({ productId: i.productId, price: i.product.price, quantity: i.quantity })) } }, include: { items: { include: { product: true } } } }); await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }); return order; }
  list(userId: string) { return this.prisma.order.findMany({ where: { userId }, include: { items: { include: { product: true } }, payments: true }, orderBy: { createdAt: 'desc' } }); }
  async get(userId: string, id: string) { const order = await this.prisma.order.findFirst({ where: { id, userId }, include: { items: { include: { product: true } }, payments: true } }); if (!order) throw new NotFoundException('Order not found'); return order; }
}
