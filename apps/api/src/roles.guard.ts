import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
@Injectable()
export class RolesGuard implements CanActivate { constructor(private readonly reflector: Reflector) {} canActivate(context: ExecutionContext) { // @Roles may sit on the class or the handler; read both or class-level metadata is invisible.
  const required = this.reflector.getAllAndOverride<string[]>('roles', [context.getHandler(), context.getClass()]) || []; if (!required.length) return true; const req = context.switchToHttp().getRequest<Request & { user?: { role: string } }>(); if (!req.user || !required.includes(req.user.role)) throw new ForbiddenException('Insufficient role'); return true; } }
