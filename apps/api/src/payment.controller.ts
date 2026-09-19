import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}
  @UseGuards(AuthGuard)
  @Post('create')
  create(@Req() req: Request & { user: { id: string } }, @Body() body: { orderId: string }) { return this.payments.create(req.user.id, body.orderId); }
  @UseGuards(AuthGuard)
  @Post(':id/confirm')
  confirm(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) { return this.payments.confirm(req.user.id, id); }
  @Post('webhook')
  webhook(@Body() body: { paymentId?: string; checkoutId?: string; eventId?: string }) { return this.payments.webhook(body); }
}
