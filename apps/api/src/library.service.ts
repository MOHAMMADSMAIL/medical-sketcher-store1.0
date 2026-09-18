import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LocalStorageProvider, StorageProvider } from './storage.provider';
@Injectable()
export class LibraryService {
  private readonly storage: StorageProvider = new LocalStorageProvider();
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.downloadPermission.findMany({ where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, include: { product: { include: { author: true, category: true } }, order: true } }); }
  async download(userId: string, productId: string) { const permission = await this.prisma.downloadPermission.findFirst({ where: { userId, productId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, include: { product: true } }); if (!permission) throw new ForbiddenException('Download permission not found'); await this.prisma.downloadLog.create({ data: { permissionId: permission.id, userId, productId, status: 'GRANTED' } }); return { permission, stream: this.storage.getStream(`books/${permission.product.slug}.txt`) }; }
}
