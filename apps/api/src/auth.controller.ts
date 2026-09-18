import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
class Credentials { @IsOptional() @IsEmail() email?: string; @IsOptional() @IsString() identifier?: string; @IsString() @MinLength(8) password!: string; @IsOptional() @IsString() name?: string; }
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() body: Credentials) { if (!body.email) throw new BadRequestException('Email is required'); return this.auth.register(body.email, body.password, body.name); }
  @Post('login') async login(@Body() body: Credentials, @Res({ passthrough: true }) res: Response) { const identifier = body.identifier || body.email; if (!identifier) throw new BadRequestException('Username or email is required'); const result = await this.auth.login(identifier, body.password); res.cookie(process.env.AUTH_COOKIE_NAME || 'aurelia_session', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 86400000, path: '/' }); return result.user; }
  @UseGuards(AuthGuard)
  @Get('me') me(@Req() req: Request & { user: unknown }) { return req.user; }
  @Post('logout') async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) { await this.auth.logout(req.cookies?.[process.env.AUTH_COOKIE_NAME || 'aurelia_session']); res.clearCookie(process.env.AUTH_COOKIE_NAME || 'aurelia_session'); return { success: true }; }
}
