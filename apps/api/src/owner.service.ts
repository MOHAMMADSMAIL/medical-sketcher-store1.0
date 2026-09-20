import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as path from 'path';
import { storageProvider, safeStorageKey } from './storage.provider';

@Injectable()
export class OwnerService {
  private readonly storage = storageProvider;
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalOrders, totalProducts, paidOrders, draftProducts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.product.count(),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.product.count({ where: { status: 'DRAFT' } }),
    ]);

    const publishedProducts = totalProducts - draftProducts;
    const totalRevenue = await this.prisma.order
      .findMany({ where: { status: 'PAID' } })
      .then(orders => orders.reduce((sum, order) => sum + Number(order.total), 0));

    return {
      totalBooks: totalProducts,
      publishedBooks: publishedProducts,
      draftBooks: draftProducts,
      comingSoonBooks: await this.prisma.product.count({ where: { status: 'COMING_SOON' } }),
      totalUsers,
      totalOrders,
      paidOrders,
      pendingOrders: totalOrders - paidOrders,
      totalRevenue,
      totalDownloads: await this.prisma.downloadLog.count(),
    };
  }

  // Books Management
  async getBooks(page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { author: true, category: true, media: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getBook(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { author: true, category: true, media: true, reviews: true },
    });
  }

  async createBook(data: any) {
    return this.prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        price: data.price,
        currency: data.currency,
        status: data.status || 'DRAFT',
        type: data.type || 'book',
        authorId: data.authorId || null,
        categoryId: data.categoryId,
      },
      include: { author: true, category: true },
    });
  }

  async updateBook(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.authorId !== undefined ? { authorId: data.authorId || null } : {}),
      },
      include: { author: true, category: true },
    });
  }

  async publishBook(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  async unpublishBook(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }

  async archiveBook(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  async restoreBook(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: 'DRAFT', archivedAt: null },
    });
  }

  async deleteBook(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  // Upload book file
  async uploadBookFile(bookId: string, file: { originalname: string; mimetype: string; size: number; buffer: Buffer }, fileType: string) {
    const extension = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const fileName = `${fileType}-${Date.now()}${extension}`;
    const storageKey = safeStorageKey(`${bookId}/${fileName}`);
    await this.storage.put(storageKey, file.buffer, file.mimetype);

    const media = await this.prisma.media.create({
      data: {
        productId: bookId,
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
        // Persist the caller-declared kind ('book' | 'cover' | ...) so product
        // images can be selected separately from protected deliverables.
        type: fileType,
        isPrimary: fileType === 'book',
      },
    });

    return {
      id: media.id,
      fileName,
      fileType,
      size: file.size,
      url: `/api/media/${media.id}`,
    };
  }

  // Authors Management
  async getAuthors(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.author.findMany({ where, skip, take: limit, include: { products: true } }),
      this.prisma.author.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createAuthor(data: any) {
    return this.prisma.author.create({
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
      },
    });
  }

  async updateAuthor(id: string, data: any) {
    return this.prisma.author.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
      },
    });
  }

  async deleteAuthor(id: string) {
    return this.prisma.author.delete({ where: { id } });
  }

  // Categories Management
  async getCategories(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({ where, skip, take: limit, include: { products: true } }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createCategory(data: any) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  }

  async updateCategory(id: string, data: any) {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  // Orders Management
  async getOrders(page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.paymentStatus) {
      where.payments = { some: { status: filters.paymentStatus } };
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: { user: true, items: { include: { product: true } }, payments: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getOrder(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { user: true, items: { include: { product: true } }, payments: true, permissions: true },
    });
  }

  // Users Management
  async getUsers(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phoneNumber: true,
          googleId: true,
          createdAt: true,
          orders: { select: { id: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: { include: { items: { include: { product: true } } } },
        permissions: { include: { product: true } },
        reviews: { include: { product: true } },
      },
    });
  }

  async updateUserRole(id: string, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
    });
  }

  // Reviews Management
  async getReviews(page = 1, limit = 10, approved?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (approved !== undefined) {
      where.approved = approved;
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: { user: true, product: true },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async approveReview(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { approved: true, rejectionReason: null },
    });
  }

  async rejectReview(id: string, reason?: string) {
    return this.prisma.review.update({
      where: { id },
      data: { approved: false, rejectionReason: reason || null },
    });
  }

  async archiveReview(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { archived: true },
    });
  }

  async getLibraryAccess(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.downloadPermission.findMany({ skip, take: limit, include: { user: true, product: true, order: true } }),
      this.prisma.downloadPermission.count(),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async extendLibraryAccess(id: string, expiresAt: Date) {
    return this.prisma.downloadPermission.update({
      where: { id },
      data: { expiresAt },
    });
  }

  async grantLibraryAccess(userId: string, productId: string) {
    return this.prisma.downloadPermission.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  }

  async revokeLibraryAccess(userId: string, productId: string) {
    return this.prisma.downloadPermission.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async getMedia(page = 1, limit = 10, type?: string) {
    const skip = (page - 1) * limit;
    const where = type ? { mimeType: { startsWith: type } } : {};
    const [items, total] = await Promise.all([
      this.prisma.media.findMany({ where, skip, take: limit, include: { product: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.media.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async uploadMedia(file: { originalname: string; mimetype: string; size: number; buffer: Buffer }, type?: string) {
    const originalName = file.originalname.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const fileName = `${Date.now()}-${originalName || 'upload'}`;
    const storageKey = safeStorageKey(`media/${fileName}`);
    await this.storage.put(storageKey, file.buffer, file.mimetype);

    const media = await this.prisma.media.create({
      data: {
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
        type: type || file.mimetype.split('/')[0],
        originalName,
      },
    });

    return {
      id: media.id,
      fileName,
      size: file.size,
      url: `/api/media/${media.id}`,
    };
  }

  async deleteMedia(id: string) {
    return this.prisma.media.delete({ where: { id } });
  }

  // Lessons Management
  async getLessons(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.lesson.findMany({ skip, take: limit, orderBy: { order: 'asc' } }),
      this.prisma.lesson.count(),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getLesson(id: string) {
    return this.prisma.lesson.findUnique({ where: { id } });
  }

  async createLesson(data: any) {
    return this.prisma.lesson.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        order: data.order ?? 0,
        status: data.status || 'DRAFT',
      },
    });
  }

  async updateLesson(id: string, data: any) {
    return this.prisma.lesson.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        order: data.order,
        status: data.status,
      },
    });
  }

  async publishLesson(id: string) {
    return this.prisma.lesson.update({ where: { id }, data: { status: 'PUBLISHED' } });
  }

  async deleteLesson(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }

  // Assessments Management
  async getAssessments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.assessment.findMany({ skip, take: limit }),
      this.prisma.assessment.count(),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getAssessment(id: string) {
    return this.prisma.assessment.findUnique({ where: { id } });
  }

  async createAssessment(data: any) {
    return this.prisma.assessment.create({
      data: {
        title: data.title,
        slug: data.slug,
        questions: data.questions,
        passScore: data.passScore ?? 70,
        status: data.status || 'DRAFT',
      },
    });
  }

  async updateAssessment(id: string, data: any) {
    return this.prisma.assessment.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        questions: data.questions,
        passScore: data.passScore,
        status: data.status,
      },
    });
  }

  async publishAssessment(id: string) {
    return this.prisma.assessment.update({ where: { id }, data: { status: 'PUBLISHED' } });
  }

  async deleteAssessment(id: string) {
    return this.prisma.assessment.delete({ where: { id } });
  }

  async getCMSContent(type: string, language: string) {
    return this.prisma.page.findFirst({ where: { slug: `${type}-${language}` }, include: { sections: true, versions: true } });
  }

  async updateCMSContent(id: string, content: any) {
    return this.prisma.page.update({ where: { id }, data: { sections: { deleteMany: {}, create: Object.entries(content || {}).map(([sectionType, value]) => ({ type: sectionType, content: value as any })) } }, include: { sections: true } });
  }

  async publishCMS(id: string) {
    return this.prisma.page.update({ where: { id }, data: { status: 'PUBLISHED' } });
  }

  async getSettings() {
    const rows = await this.prisma.siteSettings.findMany();
    return Object.fromEntries(rows.map(row => [row.key, row.value]));
  }

  async updateSettings(data: Record<string, unknown>) {
    await this.prisma.$transaction(Object.entries(data).map(([key, value]) => this.prisma.siteSettings.upsert({ where: { key }, update: { value: value as any }, create: { key, value: value as any } })));
    return this.getSettings();
  }

  async getAnalytics() {
    const [events, revenue] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({ by: ['name'], _count: { _all: true } }),
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
    ]);
    return { events, revenue: revenue._sum.total || 0 };
  }

  // Audit Logs
  async getAuditLogs(page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters?.userId) where.userId = filters.userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createAuditLog(userId: string, action: string, entity: string, entityId: string, metadata?: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata,
      },
    });
  }
}
