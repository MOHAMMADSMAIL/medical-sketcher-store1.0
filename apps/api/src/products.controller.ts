import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() list(@Query('search') search?: string) { return this.products.list().then(items => search ? items.filter(item => item.title.toLowerCase().includes(search.toLowerCase())) : items); }
  @Get('slug/:slug') async bySlug(@Param('slug') slug: string) { const item = await this.products.findBySlug(slug); if (!item) throw new NotFoundException('Product not found'); return item; }
  @Get(':id') async byId(@Param('id') id: string) { const item = await this.products.findById(id); if (!item) throw new NotFoundException('Product not found'); return item; }
}
