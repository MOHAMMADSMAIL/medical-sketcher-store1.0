import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Public store taxonomy: CEFR level sections and custom store sections (e.g. merch). */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } });
  }
}
