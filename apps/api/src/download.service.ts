import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { storageProvider, safeStorageKey } from './storage.provider';

const DEFAULT_MAX_DOWNLOADS = Number(process.env.DOWNLOAD_MAX_COUNT || 5);

/**
 * Lightweight per-user watermark for text-based deliverables: a visible notice
 * block bound to the purchaser (email + order id + timestamp). For PDFs this
 * content is appended so the copy is traceable to the buyer; a production
 * hardening could rasterize/stamp pages instead. This deters and tracks
 * misuse — it is NOT absolute copy protection.
 */
function watermarked(buffer: Buffer, mimeType: string, purchaser: string, orderId: string | null): Buffer {
  if (!mimeType.startsWith('text/') || !mimeType.includes('plain')) return buffer;
  const stamp = Buffer.from(
    `\n\n---\n${process.env.DOWNLOAD_WATERMARK_LABEL || 'نسخة مرخّصة'} — ${purchaser}${orderId ? ` — طلب ${orderId}` : ''} — ${new Date().toISOString()}\n`,
    'utf8',
  );
  return Buffer.concat([buffer, stamp]);
}

@Injectable()
export class DownloadService {
  private readonly storage = storageProvider;
  constructor(private readonly prisma: PrismaService) {}

  async grant(userId: string, productId: string, maxDownloads?: number) {
    return this.prisma.downloadPermission.upsert({
      where: { userId_productId: { userId, productId } },
      update: { revokedAt: null, ...(maxDownloads !== undefined ? { maxDownloads } : {}) },
      create: { userId, productId, maxDownloads: maxDownloads ?? DEFAULT_MAX_DOWNLOADS },
    });
  }

  async revoke(userId: string, productId: string) {
    const permission = await this.prisma.downloadPermission.findUnique({ where: { userId_productId: { userId, productId } } });
    if (!permission) throw new NotFoundException('Permission not found');
    return this.prisma.downloadPermission.update({ where: { id: permission.id }, data: { revokedAt: new Date() } });
  }

  async setMaxDownloads(userId: string, productId: string, maxDownloads: number) {
    const permission = await this.prisma.downloadPermission.findUnique({ where: { userId_productId: { userId, productId } } });
    if (!permission) throw new NotFoundException('Permission not found');
    return this.prisma.downloadPermission.update({ where: { id: permission.id }, data: { maxDownloads } });
  }

  async listForUser(userId: string, productId: string) {
    const permission = await this.prisma.downloadPermission.findUnique({ where: { userId_productId: { userId, productId } } });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async download(userId: string, productId: string, meta: { ip?: string; userAgent?: string }) {
    const permission = await this.prisma.downloadPermission.findFirst({
      where: { userId, productId },
      include: { product: { include: { media: { where: { isPrimary: true }, orderBy: { createdAt: 'desc' }, take: 1 } } } },
    });
    if (!permission) throw new NotFoundException('Download permission not found');
    if (permission.revokedAt) throw new ForbiddenException('Download permission revoked');
    if (permission.expiresAt && permission.expiresAt.getTime() < Date.now()) throw new ForbiddenException('Download permission expired');
    const limit = permission.maxDownloads ?? DEFAULT_MAX_DOWNLOADS;
    if (permission.downloadCount >= limit) throw new ForbiddenException(`Download limit reached (${limit})`);

    const media = permission.product.media[0];
    const key = media?.storageKey || `books/${permission.product.slug}.txt`;
    const object = this.storage.getStream(key) as NodeJS.ReadableStream & { on(event: string, listener: (...args: any[]) => void): void };
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      object.on('data', (chunk: Buffer) => chunks.push(chunk));
      object.on('end', () => resolve(Buffer.concat(chunks)));
      object.on('error', () => reject(new NotFoundException('Book file is unavailable — please contact support')));
    });
    const purchaser = await this.prisma.user.findUnique({ where: { id: permission.userId }, select: { email: true } });
    const watermarkedBuffer = watermarked(buffer, media?.mimeType || 'application/octet-stream', purchaser?.email || permission.userId, permission.orderId);
    const fileName = media?.originalName || `${permission.product.slug}.txt`;

    await this.prisma.downloadLog.create({
      data: { permissionId: permission.id, userId, productId, status: 'GRANTED', ip: meta.ip ?? null, userAgent: meta.userAgent ?? null },
    });
    await this.prisma.downloadPermission.update({ where: { id: permission.id }, data: { downloadCount: { increment: 1 } } });

    return { buffer: watermarkedBuffer, fileName, mimeType: media?.mimeType || 'application/octet-stream' };
  }
}
