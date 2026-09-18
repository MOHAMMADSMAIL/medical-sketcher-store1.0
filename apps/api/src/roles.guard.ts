import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
@Injectable()
export class RolesGuard implements CanActivate { canActivate(context: ExecutionContext) { const required = Reflect.getMetadata('roles', context.getHandler()) || []; if (!required.length) return true; const req = context.switchToHttp().getRequest<Request & { user?: { role: string } }>(); if (!req.user || !required.includes(req.user.role)) throw new ForbiddenException('Insufficient role'); return true; } }
