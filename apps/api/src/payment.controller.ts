import { Body, Controller, ForbiddenException, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { AuthGuard } from './auth.guard';
import { PaymentService } from './payment.service';

/**
 * Shared secret for payment webhooks. Gateways like HyperPay let you configure
 * a per-endpoint secret; when PAYMENT_WEBHOOK_SECRET is set, every webhook call
 * must carry it in the x-webhook-secret header. Unset = local/dev convenience.
 */
function assertWebhookSecret(req: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return;
  const provided = String(req.headers['x-webhook-secret'] || '');
  const a = Buffer.from(secret);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ForbiddenException('Invalid webhook secret');
}

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
  webhook(@Req() req: Request, @Body() body: { paymentId?: string; checkoutId?: string; eventId?: string }) {
    assertWebhookSecret(req);
    return this.payments.webhook(body);
  }
}
