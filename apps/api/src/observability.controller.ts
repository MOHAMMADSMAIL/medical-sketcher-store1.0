import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from './prisma.service';
import { AuthGuard } from './auth.guard';
@Controller('analytics')
export class ObservabilityController { constructor(private readonly prisma: PrismaService) {} @Post('events') async event(@Req() req: Request & { user?: { id: string } }, @Body() body: { name: string; path?: string; metadata?: unknown }) { return this.prisma.analyticsEvent.create({ data: { name: body.name, path: body.path, metadata: body.metadata as any, userId: req.user?.id } }); } }
