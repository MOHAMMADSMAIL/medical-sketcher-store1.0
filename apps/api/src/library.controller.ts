import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { LibraryService } from './library.service';
import { DownloadService } from './download.service';

@Controller()
@UseGuards(AuthGuard)
export class LibraryController {
  constructor(private readonly library: LibraryService, private readonly downloads: DownloadService) {}

  @Get('library')
  list(@Req() req: Request & { user: { id: string } }) { return this.library.list(req.user.id); }

  // Single DRM-enforcing download path: watermark, download-count limit, IP/UA logging.
  @Get('downloads/:productId')
  async download(
    @Req() req: Request & { user: { id: string } },
    @Param('productId') productId: string,
    @Res() res: Response,
  ) {
    const result = await this.downloads.download(req.user.id, productId, {
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
    res.end(result.buffer);
  }
}
