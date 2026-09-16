import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OwnerService {
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
        authorId: data.authorId,
        categoryId: data.categoryId,
      },
      include: { author: true, category: true },
    });
  }

  async updateBook(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        price: data.price,
        currency: data.currency,
        status: data.status,
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

  async deleteBook(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  // Upload book file
  async uploadBookFile(bookId: string, file: Express.Multer.File, fileType: string) {
    const storageDir = path.join(process.cwd(), 'storage', bookId);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const fileName = `${fileType}-${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(storageDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const media = await this.prisma.media.create({
      data: {
        productId: bookId,
        storageKey: `${bookId}/${fileName}`,
        mimeType: file.mimetype,
        size: file.size,
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
      data: { approved: true },
    });
  }

  async rejectReview(id: string) {
    return this.prisma.review.delete({ where: { id } });
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
