import { BadRequestException, Controller, Get, Query, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from './prisma.service';

/**
 * Customer-only Google sign-in (task 7).
 *
 * Hand-rolled OAuth 2.0 authorization-code flow with zero new dependencies:
 *   1. GET /api/auth/google          -> redirect to Google's consent screen
 *   2. GET /api/auth/google/callback -> verify state, exchange code for tokens,
 *      decode the ID token payload (signature already verified by Google over
 *      TLS — we still re-check iss/aud/exp), upsert the customer, issue the
 *      same httpOnly session cookie as password login.
 *
 * SECURITY: a Google sign-in can only ever create or attach a CUSTOMER.
 * Existing OWNER/ADMIN accounts with the same email keep their role untouched.
 * The owner login page (/owner) never links to this flow.
 */

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new BadRequestException('Google sign-in is not configured');
  return { clientId, clientSecret };
}

function callbackUrl(req: Request): string {
  const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/api/auth/google/callback`;
}

type IdTokenPayload = { iss?: string; aud?: string; exp?: number; email?: string; email_verified?: boolean; name?: string; sub?: string };

function decodeIdToken(idToken: string): IdTokenPayload {
  const [, payload] = idToken.split('.');
  if (!payload) throw new UnauthorizedException('Malformed Google response');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as IdTokenPayload;
}

function verifyIdToken(payload: IdTokenPayload, clientId: string): { googleId: string; email: string; name?: string } {
  const now = Math.floor(Date.now() / 1000);
  const valid =
    payload.iss === 'https://accounts.google.com' &&
    payload.aud === clientId &&
    typeof payload.exp === 'number' &&
    payload.exp > now &&
    payload.email &&
    payload.sub;
  if (!valid) throw new UnauthorizedException('Google identity could not be verified');
  return { googleId: payload.sub as string, email: (payload.email as string).toLowerCase(), name: payload.name };
}

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  redirect(@Res() res: Response, @Query('next') next?: string) {
    const { clientId } = googleConfig();
    const state = randomBytes(16).toString('hex');
    const url = new URL(GOOGLE_AUTH);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callbackUrl(res.req));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');
    // Short-lived state cookie (double-submit against CSRF on the callback)
    res.cookie('g_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000, path: '/' });
    if (next && next.startsWith('/')) res.cookie('g_next', next, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000, path: '/' });
    return res.redirect(url.toString());
  }

  @Get('callback')
  async callback(@Res() res: Response, @Query('code') code?: string, @Query('state') state?: string) {
    if (!code || !state) throw new BadRequestException('Missing code or state');
    const cookieState = res.req.cookies?.g_state;
    const a = Buffer.from(state);
    const b = Buffer.from(cookieState || '');
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Invalid OAuth state');
    res.clearCookie('g_state', { path: '/' });

    const { clientId, clientSecret } = googleConfig();
    const tokenRes = await fetch(GOOGLE_TOKEN, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl(res.req),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) throw new UnauthorizedException('Google token exchange failed');
    const tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokens.id_token) throw new UnauthorizedException('Google did not return an identity token');

    const identity = verifyIdToken(decodeIdToken(tokens.id_token), clientId);

    // Upsert the customer. Role is NEVER taken from Google; an existing
    // owner/admin with the same email keeps their role (only googleId links).
    const user = await this.prisma.user.upsert({
      where: { email: identity.email },
      create: { email: identity.email, name: identity.name, role: 'CUSTOMER', googleId: identity.googleId, passwordHash: createHash('sha256').update(`google:${identity.googleId}`).digest('hex') },
      update: { googleId: identity.googleId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (user.role !== 'CUSTOMER') {
      // Link the identity but do not hand out elevated sessions via Google.
      await this.prisma.auditLog.create({ data: { userId: user.id, action: 'google-signin-denied', entity: 'User', entityId: user.id, metadata: { role: user.role } as object } });
      return res.status(403).send('Google sign-in is available for customer accounts only.');
    }

    const raw = randomBytes(32).toString('hex');
    await this.prisma.session.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 30 * 86400000) } });
    res.cookie(process.env.AUTH_COOKIE_NAME || 'aurelia_session', raw, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 86400000, path: '/' });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'google-signin', entity: 'User', entityId: user.id, metadata: { method: 'google' } as object } });

    const nextCookie = res.req.cookies?.g_next;
    res.clearCookie('g_next', { path: '/' });
    const webBase = (process.env.WEB_URL || 'http://localhost:3001').replace(/\/$/, '');
    const next = nextCookie && nextCookie.startsWith('/') ? nextCookie : '/';
    return res.redirect(`${webBase}${next}`);
  }
}
