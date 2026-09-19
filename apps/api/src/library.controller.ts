import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { LibraryService } from './library.service';
@Controller()
@UseGuards(AuthGuard)
export class LibraryController { constructor(private readonly library: LibraryService) {} @Get('library') list(@Req() req: Request & { user: { id: string } }) { return this.library.list(req.user.id); } @Get('downloads/:productId') async download(@Req() req: Request & { user: { id: string } }, @Param('productId') productId: string, @Res() res: Response) { const result = await this.library.download(req.user.id, productId); res.setHeader('Content-Type', result.mimeType); res.setHeader('Content-Disposition', `attachment; filename="${result.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`); (result.stream as any).pipe(res); } }
