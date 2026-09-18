import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Controller('pages')
export class CmsController { constructor(private readonly prisma: PrismaService) {} @Get(':slug') async page(@Param('slug') slug: string) { const page = await this.prisma.page.findFirst({ where: { slug, status: 'PUBLISHED' }, include: { sections: true, versions: { orderBy: { version: 'desc' }, take: 1 } } }); if (!page) throw new NotFoundException('Page not found'); return page; } }
