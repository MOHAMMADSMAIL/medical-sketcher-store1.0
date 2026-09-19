import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { DownloadService } from './download.service';
import { PrismaService } from './prisma.service';
import { Roles, RolesGuard } from './roles.guard';
import { OwnerService } from './owner.service';

function parseDate(value: unknown): Date {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');
  return date;
}

@Controller('owner')
@UseGuards(AuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class DownloadController {
  constructor(private readonly prisma: PrismaService, private readonly downloads: DownloadService, private readonly owner: OwnerService) {}

  // Library access management (routes already consumed by the owner web UI)
  @Get('library')
  library(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.owner.getLibraryAccess(Number(page), Number(limit));
  }

  @Get('users/:userId/library/:productId')
  async userLibraryAccess(@Param('userId') userId: string, @Param('productId') productId: string) {
    const permission = await this.prisma.downloadPermission.findUnique({
      where: { userId_productId: { userId, productId } },
      include: { product: true, user: { select: { id: true, email: true, name: true } } },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  @Post('users/:userId/library/:productId')
  async grantAccess(@Req() req: Request & { user: { id: string } }, @Param('userId') userId: string, @Param('productId') productId: string, @Body('maxDownloads') maxDownloads?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found');
    const permission = await this.downloads.grant(userId, productId, maxDownloads);
    await this.owner.createAuditLog(req.user.id, 'grant', 'DownloadPermission', permission.id, { userId, productId, maxDownloads: maxDownloads ?? null });
    return permission;
  }

  @Delete('users/:userId/library/:productId')
  async revokeAccess(@Req() req: Request & { user: { id: string } }, @Param('userId') userId: string, @Param('productId') productId: string) {
    const permission = await this.downloads.revoke(userId, productId);
    await this.owner.createAuditLog(req.user.id, 'revoke', 'DownloadPermission', permission.id, { userId, productId });
    return permission;
  }

  @Post('users/:userId/library/:productId/restore')
  async restoreAccess(@Req() req: Request & { user: { id: string } }, @Param('userId') userId: string, @Param('productId') productId: string) {
    const permission = await this.downloads.grant(userId, productId);
    await this.owner.createAuditLog(req.user.id, 'restore', 'DownloadPermission', permission.id, { userId, productId });
    return permission;
  }

  @Post('library/:id/extend')
  async extend(@Req() req: Request & { user: { id: string } }, @Param('id') id: string, @Body('expiresAt') expiresAt: unknown) {
    const permission = await this.owner.extendLibraryAccess(id, parseDate(expiresAt));
    await this.owner.createAuditLog(req.user.id, 'extend', 'DownloadPermission', id, { expiresAt: permission.expiresAt });
    return permission;
  }

  // DRM controls
  @Patch('users/:userId/library/:productId/limits')
  async setLimits(
    @Req() req: Request & { user: { id: string } },
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Body('maxDownloads') maxDownloads: unknown,
  ) {
    const limit = Number(maxDownloads);
    if (!Number.isInteger(limit) || limit < 1) throw new BadRequestException('maxDownloads must be a positive integer');
    const permission = await this.downloads.setMaxDownloads(userId, productId, limit);
    await this.owner.createAuditLog(req.user.id, 'set-limits', 'DownloadPermission', permission.id, { userId, productId, maxDownloads: limit });
    return permission;
  }

  @Get('users/:userId/downloads/:productId/logs')
  async downloadLogs(@Param('userId') userId: string, @Param('productId') productId: string, @Query('limit') limit = '50') {
    const permission = await this.prisma.downloadPermission.findUnique({ where: { userId_productId: { userId, productId } } });
    if (!permission) throw new NotFoundException('Permission not found');
    const logs = await this.prisma.downloadLog.findMany({
      where: { permissionId: permission.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
    });
    return { permission: { id: permission.id, downloadCount: permission.downloadCount, maxDownloads: permission.maxDownloads, revokedAt: permission.revokedAt }, logs };
  }

  // Archive restore
  @Post('books/:id/restore')
  async restoreBook(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'ARCHIVED') throw new BadRequestException('Product is not archived');
    const restored = await this.owner.restoreBook(id);
    await this.owner.createAuditLog(req.user.id, 'restore', 'Product', id, { title: restored.title, previousStatus: 'ARCHIVED' });
    return restored;
  }
}
