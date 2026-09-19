import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { storageProvider, StorageProvider, storageKeyForProduct } from './storage.provider';
@Injectable()
export class LibraryService {
  private readonly storage: StorageProvider = storageProvider;
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.downloadPermission.findMany({ where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, include: { product: { include: { author: true, category: true, media: true } }, order: true } }); }
  async download(userId: string, productId: string) { const permission = await this.prisma.downloadPermission.findFirst({ where: { userId, productId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, include: { product: { include: { media: { where: { isPrimary: true }, take: 1 } } } } }); if (!permission) throw new ForbiddenException('Download permission not found'); await this.prisma.downloadLog.create({ data: { permissionId: permission.id, userId, productId, status: 'GRANTED' } }); const media = permission.product.media[0]; return { permission, stream: this.storage.getStream(storageKeyForProduct(permission.product.slug, media)), fileName: media?.originalName || `${permission.product.slug}.txt`, mimeType: media?.mimeType || 'text/plain' }; }
}
