import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthGuard } from './auth.guard';
import { Roles, RolesGuard } from './roles.guard';

@Controller('owner/learning-content')
@UseGuards(AuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class LearningContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: Record<string, string>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const where: any = { archivedAt: null };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.visibility) where.visibility = query.visibility;
    if (query.search) where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }];
    const [items, total] = await Promise.all([
      this.prisma.learningContent.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }], include: { media: true } }),
      this.prisma.learningContent.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.prisma.learningContent.findUnique({ where: { id }, include: { media: true } });
  }

  @Post()
  create(@Body() body: Record<string, any>) {
    return this.prisma.learningContent.create({ data: this.normalise(body) as any, include: { media: true } });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.prisma.learningContent.update({ where: { id }, data: this.normalise(body, false), include: { media: true } });
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.prisma.learningContent.update({ where: { id }, data: { status: 'PUBLISHED', archivedAt: null } });
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.prisma.learningContent.update({ where: { id }, data: { archivedAt: new Date(), status: 'DRAFT' } });
  }

  private normalise(body: Record<string, any>, creating = true) {
    const data: Record<string, any> = {};
    for (const key of ['type', 'title', 'slug', 'description', 'body', 'metadata', 'mediaId', 'duration', 'visibility', 'status', 'order']) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (creating) {
      data.type ||= 'READING';
      data.title ||= 'Untitled learning content';
      data.slug ||= `${String(data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
      data.visibility ||= 'OWNER_ONLY';
      data.status ||= 'DRAFT';
    }
    return data;
  }
}
