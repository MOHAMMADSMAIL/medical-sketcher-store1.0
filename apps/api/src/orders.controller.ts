import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { OrdersService } from './orders.service';
@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController { constructor(private readonly orders: OrdersService) {} @Post() create(@Req() req: Request & { user: { id: string } }) { return this.orders.create(req.user.id); } @Get() list(@Req() req: Request & { user: { id: string } }) { return this.orders.list(req.user.id); } @Get(':id') get(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) { return this.orders.get(req.user.id, id); } }
