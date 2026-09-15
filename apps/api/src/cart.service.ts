import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}
  private async getOrCreate(userId: string) { return this.prisma.cart.upsert({ where: { userId }, update: {}, create: { userId }, include: { items: { include: { product: { include: { author: true, category: true } } } } } }); }
  private shape(cart: any) { const items = cart.items.map((i: any) => ({ ...i, unitPrice: Number(i.product.price), lineTotal: Number(i.product.price) * i.quantity })); return { ...cart, items, subtotal: items.reduce((s: number, i: any) => s + i.lineTotal, 0), currency: 'USD' }; }
  async get(userId: string) { return this.shape(await this.getOrCreate(userId)); }
  async add(userId: string, productId: string, quantity: number) { if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new BadRequestException('Invalid quantity'); const product = await this.prisma.product.findFirst({ where: { id: productId, status: 'PUBLISHED' } }); if (!product) throw new NotFoundException('Product not found'); const cart = await this.prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } }); await this.prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId } }, update: { quantity: { increment: quantity } }, create: { cartId: cart.id, productId, quantity } }); return this.get(userId); }
  async update(userId: string, itemId: string, quantity: number) { if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new BadRequestException('Invalid quantity'); const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId } } }); if (!item) throw new NotFoundException('Cart item not found'); await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } }); return this.get(userId); }
  async remove(userId: string, itemId: string) { const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId } } }); if (!item) throw new NotFoundException('Cart item not found'); await this.prisma.cartItem.delete({ where: { id: itemId } }); return this.get(userId); }
  async clear(userId: string) { const cart = await this.prisma.cart.findUnique({ where: { userId } }); if (cart) await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }); return this.get(userId); }
}
