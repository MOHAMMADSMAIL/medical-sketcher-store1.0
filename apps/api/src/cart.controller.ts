import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { CartService } from './cart.service';
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}
  @Get() get(@Req() req: Request & { user: { id: string } }) { return this.cart.get(req.user.id); }
  @Post('items') add(@Req() req: Request & { user: { id: string } }, @Body() body: { productId: string; quantity: number }) { return this.cart.add(req.user.id, body.productId, body.quantity); }
  @Patch('items/:id') update(@Req() req: Request & { user: { id: string } }, @Param('id') id: string, @Body() body: { quantity: number }) { return this.cart.update(req.user.id, id, body.quantity); }
  @Delete('items/:id') remove(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) { return this.cart.remove(req.user.id, id); }
  @Delete() clear(@Req() req: Request & { user: { id: string } }) { return this.cart.clear(req.user.id); }
}
