import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from './prisma.service';
import { AuthGuard } from './auth.guard';
import { Roles, RolesGuard } from './roles.guard';
import { OwnerService } from './owner.service';
import { CreateAssessmentDto, CreateAuthorDto, CreateBookDto, CreateCategoryDto, CreateLessonDto, CreatePageDto, SettingDto, UpdateAssessmentDto, UpdateAuthorDto, UpdateBookDto, UpdateCategoryDto, UpdateLessonDto, UpdatePageDto, UpdateReviewDto, UpdateUserDto } from './owner.dto';
import type { Request } from 'express';

@Controller('owner')
@UseGuards(AuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class OwnerController {
  constructor(private readonly prisma: PrismaService, private readonly owner: OwnerService) {}

  @Get('dashboard/stats')
  dashboardStats() { return this.owner.getDashboardStats(); }

  @Get('books')
  books(@Query('page') page = '1', @Query('limit') limit = '20', @Query() filters: Record<string, any>) { return this.owner.getBooks(Number(page), Number(limit), filters); }

  @Get('books/:id')
  book(@Param('id') id: string) { return this.owner.getBook(id); }

  @Post('books')
  createBook(@Body() body: CreateBookDto) { return this.owner.createBook(body); }

  @Put('books/:id')
  updateBook(@Param('id') id: string, @Body() body: UpdateBookDto) { return this.owner.updateBook(id, body); }

  @Post('books/:id/publish')
  publishBook(@Param('id') id: string) { return this.owner.publishBook(id); }

  @Post('books/:id/unpublish')
  unpublishBook(@Param('id') id: string) { return this.owner.unpublishBook(id); }

  @Post('books/:id/archive')
  async archiveBook(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    const archived = await this.owner.archiveBook(id);
    await this.owner.createAuditLog(req.user.id, 'archive', 'Product', id, { title: archived.title, previousStatus: archived.status === 'ARCHIVED' ? 'PUBLISHED' : 'DRAFT' });
    return archived;
  }

  @Delete('books/:id')
  async deleteBook(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    const sold = await this.prisma.orderItem.count({ where: { productId: id } });
    if (sold > 0) throw new BadRequestException('This book has recorded sales and cannot be deleted — archive it instead.');
    const deleted = await this.owner.deleteBook(id);
    await this.owner.createAuditLog(req.user.id, 'delete', 'Product', id, { title: deleted.title });
    return { deleted: true, id };
  }

  @Post('books/:id/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /^(application|audio|image|text)\//.test(file.mimetype)) }))
  uploadBook(@Param('id') id: string, @UploadedFile() file: any, @Body('fileType') fileType = 'book') {
    if (!file) throw new BadRequestException('A supported file is required');
    return this.owner.uploadBookFile(id, file, fileType);
  }

  @Get('media')
  media(@Query('page') page = '1', @Query('limit') limit = '20', @Query('type') type?: string) { return this.owner.getMedia(Number(page), Number(limit), type); }

  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /^(application|audio|image|text)\//.test(file.mimetype)) }))
  uploadMedia(@UploadedFile() file: any, @Body('type') type?: string) {
    if (!file) throw new BadRequestException('A supported file is required');
    return this.owner.uploadMedia(file, type);
  }

  @Delete('media/:id')
  deleteMedia(@Param('id') id: string) { return this.owner.deleteMedia(id); }

  @Get('authors')
  authors(@Query('page') page = '1', @Query('limit') limit = '20', @Query('search') search?: string) { return this.owner.getAuthors(Number(page), Number(limit), search); }
  @Post('authors')
  createAuthor(@Body() body: CreateAuthorDto) { return this.owner.createAuthor(body); }
  @Put('authors/:id')
  updateAuthor(@Param('id') id: string, @Body() body: UpdateAuthorDto) { return this.owner.updateAuthor(id, body); }
  @Delete('authors/:id')
  deleteAuthor(@Param('id') id: string) { return this.owner.deleteAuthor(id); }

  @Get('categories')
  categories(@Query('page') page = '1', @Query('limit') limit = '20', @Query('search') search?: string) { return this.owner.getCategories(Number(page), Number(limit), search); }
  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto) { return this.owner.createCategory(body); }
  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto) { return this.owner.updateCategory(id, body); }
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) { return this.owner.deleteCategory(id); }

  @Get('lessons')
  lessons(@Query('page') page = '1', @Query('limit') limit = '20') { return this.owner.getLessons(Number(page), Number(limit)); }
  @Post('lessons')
  createLesson(@Body() body: CreateLessonDto) { return this.owner.createLesson(body); }
  @Put('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() body: UpdateLessonDto) { return this.owner.updateLesson(id, body); }
  @Post('lessons/:id/publish')
  publishLesson(@Param('id') id: string) { return this.owner.publishLesson(id); }

  @Get('assessments')
  assessments(@Query('page') page = '1', @Query('limit') limit = '20') { return this.owner.getAssessments(Number(page), Number(limit)); }
  @Post('assessments')
  createAssessment(@Body() body: CreateAssessmentDto) { return this.owner.createAssessment(body); }
  @Put('assessments/:id')
  updateAssessment(@Param('id') id: string, @Body() body: UpdateAssessmentDto) { return this.owner.updateAssessment(id, body); }
  @Post('assessments/:id/publish')
  publishAssessment(@Param('id') id: string) { return this.owner.publishAssessment(id); }

  @Get('orders')
  ownerOrders(@Query('search') search?: string) {
    return this.prisma.order.findMany({
      where: search ? { OR: [{ id: { contains: search } }, { user: { email: { contains: search } } }] } : undefined,
      include: { user: true, items: { include: { product: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });
  }

  @Get('users')
  ownerUsers(@Query('search') search?: string) {
    return this.prisma.user.findMany({
      where: search ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] } : undefined,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });
  }

  @Patch('users/:id')
  async updateUser(@Req() req: Request & { user: { id: string } }, @Param('id') id: string, @Body() body: UpdateUserDto) {
    const allowed = ['CUSTOMER', 'ADMIN', 'OWNER'];
    if (body.role && !allowed.includes(body.role)) throw new BadRequestException('Invalid role');
    const previous = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!previous) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({ where: { id }, data: body.role ? { role: body.role as any } : {}, select: { id: true, email: true, name: true, role: true } });
    if (body.role && previous.role !== updated.role) await this.owner.createAuditLog(req.user.id, 'role-change', 'User', id, { from: previous.role, to: updated.role });
    return updated;
  }

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
      where: search ? { OR: [{ title: { contains: search } }, { slug: { contains: search } }] } : undefined,
      include: { author: true, category: true, _count: { select: { orderItems: true, reviews: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Post('products')
  async createProduct(@Req() req: Request & { user: { id: string } }, @Body() body: CreateBookDto) {
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
    await this.owner.createAuditLog(req.user.id, 'create', 'Product', product.id, { title: product.title, price: product.price, status: product.status });
    return product;
  }

  @Patch('products/:id')
  async updateProduct(@Req() req: Request & { user: { id: string } }, @Param('id') id: string, @Body() body: UpdateBookDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');
    const allowed = ['title', 'slug', 'description', 'price', 'currency', 'status', 'authorId', 'categoryId'];
    const data = Object.fromEntries(Object.entries(body).filter(([key, value]) => allowed.includes(key) && value !== undefined));
    const updated = await this.prisma.product.update({ where: { id }, data: data as any, include: { author: true, category: true } });
    await this.owner.createAuditLog(req.user.id, 'update', 'Product', id, { before: { title: existing.title, price: existing.price, status: existing.status }, after: { title: updated.title, price: updated.price, status: updated.status } });
    return updated;
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
  async review(@Req() req: Request & { user: { id: string } }, @Param('id') id: string, @Body() body: UpdateReviewDto) {
    const updated = await this.prisma.review.update({ where: { id }, data: { approved: Boolean(body.approved) }, include: { user: true, product: true } });
    await this.owner.createAuditLog(req.user.id, Boolean(body.approved) ? 'approve' : 'reject', 'Review', id, { productId: updated.productId, userId: updated.userId });
    return updated;
  }

  @Get('pages')
  pages() {
    return this.prisma.page.findMany({ include: { sections: true, versions: { orderBy: { version: 'desc' }, take: 5 } }, orderBy: { slug: 'asc' } });
  }

  @Post('pages')
  async createPage(@Req() req: Request & { user: { id: string } }, @Body() body: CreatePageDto) {
    return this.prisma.page.create({ data: { slug: String(body.slug), title: String(body.title), status: String(body.status || 'DRAFT'), sections: { create: Array.isArray(body.sections) ? body.sections.map((section: any) => ({ type: String(section.type || 'content'), content: section.content || {} })) : [] } }, include: { sections: true } });
  }

  @Patch('pages/:id')
  async updatePage(@Req() req: Request & { user: { id: string } }, @Param('id') id: string, @Body() body: UpdatePageDto) {
    const page = await this.prisma.page.findUnique({ where: { id }, include: { versions: true } });
    if (!page) throw new NotFoundException('Page not found');
    const nextVersion = page.versions.reduce((max, version) => Math.max(max, version.version), 0) + 1;
    const title = body.title ?? page.title;
    const slug = body.slug ?? page.slug;
    const status = body.status ?? page.status;
    const content = (body.content || { sections: body.sections || [] }) as any;
    const updated = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.page.update({ where: { id }, data: { title, slug, status } });
      await tx.pageVersion.create({ data: { pageId: id, version: nextVersion, content } });
      if (Array.isArray(body.sections)) {
        await tx.section.deleteMany({ where: { pageId: id } });
        await tx.section.createMany({ data: body.sections.map((section: any) => ({ pageId: id, type: String(section.type || 'content'), content: section.content ?? {} })) });
      }
      return updated;
    });
    await this.owner.createAuditLog(req.user.id, 'update', 'Page', id, { title: updated.title, slug: updated.slug });
    return updated;
  }

  @Post('pages/:id/publish')
  publishPage(@Param('id') id: string) {
    return this.prisma.page.update({ where: { id }, data: { status: 'PUBLISHED' }, include: { sections: true } });
  }

  @Get('settings')
  settings() { return this.prisma.siteSettings.findMany({ orderBy: { key: 'asc' } }); }

  @Put('settings/:key')
  setting(@Param('key') key: string, @Body() body: SettingDto) {
    return this.prisma.siteSettings.upsert({ where: { key }, update: { value: body.value as any }, create: { key, value: body.value as any } });
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
