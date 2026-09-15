import { Controller, Delete, Get, Param, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from './prisma.service';
import { AuthGuard } from './auth.guard';
@Controller('wishlist')
@UseGuards(AuthGuard)
export class WishlistController { constructor(private readonly prisma: PrismaService) {} @Get() list(@Req() req: Request & { user: { id: string } }) { return this.prisma.wishlistItem.findMany({ where: { userId: req.user.id }, include: { product: true } }); } @Post(':productId') async add(@Req() req: Request & { user: { id: string } }, @Param('productId') productId: string) { const product = await this.prisma.product.findUnique({ where: { id: productId } }); if (!product) throw new NotFoundException('Product not found'); return this.prisma.wishlistItem.upsert({ where: { userId_productId: { userId: req.user.id, productId } }, update: {}, create: { userId: req.user.id, productId }, include: { product: true } }); } @Delete(':productId') remove(@Req() req: Request & { user: { id: string } }, @Param('productId') productId: string) { return this.prisma.wishlistItem.deleteMany({ where: { userId: req.user.id, productId } }); } }
