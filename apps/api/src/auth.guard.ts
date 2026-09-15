import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) { const req = context.switchToHttp().getRequest<Request & { user?: unknown }>(); const token = req.cookies?.[process.env.AUTH_COOKIE_NAME || 'aurelia_session']; const user = await this.auth.fromToken(token); if (!user) throw new UnauthorizedException('Authentication required'); req.user = user; return true; }
}
