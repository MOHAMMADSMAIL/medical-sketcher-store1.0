import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthGuard } from './auth.guard';
import { Roles, RolesGuard } from './roles.guard';
@Controller('owner')
@UseGuards(AuthGuard, RolesGuard)
@Roles('OWNER')
export class OwnerController { constructor(private readonly prisma: PrismaService) {} @Get('dashboard') async dashboard() { const [users, products, orders, payments, events] = await Promise.all([this.prisma.user.count(), this.prisma.product.count(), this.prisma.order.count(), this.prisma.payment.count(), this.prisma.analyticsEvent.count()]); return { users, products, orders, payments, events }; } }
