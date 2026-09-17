import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthGuard } from './auth.guard';
import { Roles, RolesGuard } from './roles.guard';

@Controller('owner')
@UseGuards(AuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class OwnerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  async dashboard() {
    const [users, products, orders, payments, events, published, reviews, downloads, revenue, recentOrders] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.payment.count(),
      this.prisma.analyticsEvent.count(),
      this.prisma.product.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.review.count({ where: { approved: false } }),
      this.prisma.downloadLog.count(),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ['PAID', 'FULFILLED'] } } }),
      this.prisma.order.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { user: true, items: { include: { product: true } } } }),
    ]);
    return {
      metrics: { users, products, orders, payments, events, published, pendingReviews: reviews, downloads, revenue: Number(revenue._sum.total || 0) },
      recentOrders,
    };
  }

  @Get('products')
  products(@Query('search') search?: string) {
    return this.prisma.product.findMany({
      where: search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }] } : undefined,
      include: { author: true, category: true, _count: { select: { orderItems: true, reviews: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Post('products')
  async createProduct(@Body() body: Record<string, any>) {
    const authorId = body.authorId || (await this.prisma.author.findFirst())?.id;
    const categoryId = body.categoryId || (await this.prisma.category.findFirst())?.id;
    if (!authorId || !categoryId) throw new NotFoundException('Create an author and category first');
    const product = await this.prisma.product.create({
      data: {
        title: String(body.title || 'Untitled book'),
        slug: String(body.slug || body.title || 'untitled-book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: String(body.description || ''),
        price: body.price ?? 0,
        currency: String(body.currency || 'USD'),
        status: body.status || 'DRAFT',
        authorId,
        categoryId,
      },
      include: { author: true, category: true },
    });
    return product;
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: Record<string, any>) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');
    const allowed = ['title', 'slug', 'description', 'price', 'currency', 'status', 'authorId', 'categoryId'];
    const data = Object.fromEntries(Object.entries(body).filter(([key, value]) => allowed.includes(key) && value !== undefined));
    return this.prisma.product.update({ where: { id }, data: data as any, include: { author: true, category: true } });
  }

  @Delete('products/:id')
  async archiveProduct(@Param('id') id: string) {
    return this.prisma.product.update({ where: { id }, data: { status: 'DRAFT' } });
  }

  @Get('reviews')
  reviews(@Query('approved') approved?: string) {
    return this.prisma.review.findMany({ where: approved === undefined ? undefined : { approved: approved === 'true' }, include: { user: true, product: true }, orderBy: { createdAt: 'desc' } });
  }

  @Patch('reviews/:id')
  review(@Param('id') id: string, @Body() body: { approved?: boolean }) {
    return this.prisma.review.update({ where: { id }, data: { approved: Boolean(body.approved) }, include: { user: true, product: true } });
  }

  @Get('pages')
  pages() {
    return this.prisma.page.findMany({ include: { sections: true, versions: { orderBy: { version: 'desc' }, take: 5 } }, orderBy: { slug: 'asc' } });
  }

  @Post('pages')
  async createPage(@Body() body: Record<string, any>) {
    return this.prisma.page.create({ data: { slug: String(body.slug), title: String(body.title), status: String(body.status || 'DRAFT'), sections: { create: Array.isArray(body.sections) ? body.sections.map((section: any) => ({ type: String(section.type || 'content'), content: section.content || {} })) : [] } }, include: { sections: true } });
  }

  @Patch('pages/:id')
  async updatePage(@Param('id') id: string, @Body() body: Record<string, any>) {
    const page = await this.prisma.page.findUnique({ where: { id }, include: { versions: true } });
    if (!page) throw new NotFoundException('Page not found');
    const nextVersion = page.versions.reduce((max, version) => Math.max(max, version.version), 0) + 1;
    const content = body.content || { sections: body.sections || [] };
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.page.update({ where: { id }, data: { title: body.title ?? page.title, slug: body.slug ?? page.slug, status: body.status ?? page.status } });
      await tx.pageVersion.create({ data: { pageId: id, version: nextVersion, content } });
      if (Array.isArray(body.sections)) {
        await tx.section.deleteMany({ where: { pageId: id } });
        await tx.section.createMany({ data: body.sections.map((section: any) => ({ pageId: id, type: String(section.type || 'content'), content: section.content || {} })) });
      }
      return updated;
    });
  }

  @Post('pages/:id/publish')
  publishPage(@Param('id') id: string) {
    return this.prisma.page.update({ where: { id }, data: { status: 'PUBLISHED' }, include: { sections: true } });
  }

  @Get('settings')
  settings() { return this.prisma.siteSettings.findMany({ orderBy: { key: 'asc' } }); }

  @Put('settings/:key')
  setting(@Param('key') key: string, @Body() body: { value: any }) {
    return this.prisma.siteSettings.upsert({ where: { key }, update: { value: body.value }, create: { key, value: body.value } });
  }

  @Get('audit')
  audit(@Query('limit') limit = '50') { return this.prisma.auditLog.findMany({ take: Math.min(Number(limit) || 50, 200), include: { user: true }, orderBy: { createdAt: 'desc' } }); }

  @Get('analytics')
  analytics() {
    return this.prisma.analyticsEvent.groupBy({ by: ['name'], _count: { _all: true }, orderBy: { _count: { name: 'desc' } }, take: 20 });
  }
}

// Prisma's Section model stores its visual order in JSON-compatible content in older databases.
// The controller intentionally keeps the payload flexible so existing databases remain compatible.
