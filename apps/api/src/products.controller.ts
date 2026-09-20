import { Controller, Get, NotFoundException, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { storageProvider, safeStorageKey } from './storage.provider';
import { Readable } from 'node:stream';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() list(@Query('search') search?: string) { return this.products.list().then(items => search ? items.filter(item => item.title.toLowerCase().includes(search.toLowerCase())) : items); }
  @Get('slug/:slug') async bySlug(@Param('slug') slug: string) { const item = await this.products.findBySlug(slug); if (!item) throw new NotFoundException('Product not found'); return item; }
  @Get('media/:mediaId') async media(@Param('mediaId') mediaId: string, @Res() res: Response) {
    // Public media route: safe for product images (covers, merch photos).
    // Only image types are served here; protected deliverables (books/PDFs)
    // keep flowing through the watermarked DRM download route exclusively.
    const media = await this.products.findMedia(mediaId);
    if (!media || !media.mimeType.startsWith('image/')) throw new NotFoundException('Media not found');
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    // Allow the storefront origin to embed this image cross-origin
    // (the API serves :3000, the web app runs on :3001).
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    Readable.from(storageProvider.getStream(safeStorageKey(media.storageKey))).pipe(res);
  }
  @Get(':id') async byId(@Param('id') id: string) { const item = await this.products.findById(id); if (!item) throw new NotFoundException('Product not found'); return item; }
}
