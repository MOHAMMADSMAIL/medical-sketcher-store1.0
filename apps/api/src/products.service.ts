import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.product.findMany({ where: { status: 'PUBLISHED' }, include: { author: true, category: true, media: { where: { type: 'cover' } }, reviews: { where: { approved: true }, select: { rating: true } } }, orderBy: { createdAt: 'desc' } }); }
  findBySlug(slug: string) { return this.prisma.product.findUnique({ where: { slug }, include: { author: true, category: true, media: { where: { type: 'cover' } }, reviews: { where: { approved: true }, include: { user: { select: { name: true, email: true } } } } } }); }
  findById(id: string) { return this.prisma.product.findFirst({ where: { id, status: 'PUBLISHED' }, include: { author: true, category: true, media: { where: { type: 'cover' } }, reviews: { where: { approved: true } } } }); }
  findMedia(mediaId: string) { return this.prisma.media.findUnique({ where: { id: mediaId } }); }
}
