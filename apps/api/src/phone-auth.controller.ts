import { BadRequestException, Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { createHash, randomInt } from 'node:crypto';
import { PrismaService } from './prisma.service';
import { AuthGuard } from './auth.guard';

/**
 * Phone sign-in / verification (task 7) — STRUCTURE ONLY by design.
 *
 * The real SMS delivery needs a paid provider (Twilio or similar) chosen and
 * paid for by the store owner. Until SMS_PROVIDER is configured:
 *   - `POST /api/auth/phone/request`  -> creates a hashed 6-digit code and,
 *     in development, returns it in the response (console provider behaviour)
 *     so the flow is fully testable end to end.
 *   - `POST /api/auth/phone/verify`   -> verifies the code, links/creates the
 *     customer account and issues the normal session cookie.
 *
 * Wiring a provider later = implement `sendSms()` below and add env vars.
 * No SMS is ever sent silently to real users from this build.
 */

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS_PER_HOUR = 5;

function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (!/^\+?\d{8,15}$/.test(digits)) throw new BadRequestException('Enter a valid phone number (8–15 digits)');
  return digits;
}

async function sendSms(to: string, message: string): Promise<void> {
  // FUTURE WIRING POINT (owner decision + paid account required):
  //   Twilio:  accountSid + authToken + messagingServiceSid  (~$0.05/US SMS, regional pricing varies)
  //   Alternatives: Vonage, MessageBird, local Jordanian aggregators.
  // Intentionally NOT integrated in this build — throws so no silent no-SMS.
  throw new BadRequestException(`SMS delivery is not configured yet. Development code for ${to}: ${message.match(/\b\d{6}\b/)?.[0]}`);
}

@Controller('auth/phone')
export class PhoneAuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('request')
  async request(@Body() body: { phone?: string }) {
    if (!body.phone) throw new BadRequestException('Phone number is required');
    const phone = normalizePhone(body.phone);
    if (process.env.NODE_ENV === 'production' && !process.env.SMS_PROVIDER) {
      throw new BadRequestException('SMS delivery is not configured yet');
    }
    const user = await this.prisma.user.findUnique({ where: { phoneNumber: phone } });
    if (!user && process.env.PHONE_SIGNUP_ENABLED !== 'true') {
      // Structure phase: phone login only for numbers already linked to an
      // account (added from the account page or by the owner). Turning open
      // phone-first registration on is an owner business decision.
      throw new BadRequestException('No account is linked to this phone number yet');
    }
    if (!user) throw new BadRequestException('Phone registration is not enabled yet');
    const recent = await this.prisma.phoneVerificationToken.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
    if (recent >= MAX_ATTEMPTS_PER_HOUR) throw new BadRequestException('Too many codes requested — try again later');
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.prisma.phoneVerificationToken.deleteMany({ where: { userId: user.id, purpose: 'LOGIN' } });
    await this.prisma.phoneVerificationToken.create({
      data: { userId: user.id, codeHash: createHash('sha256').update(code).digest('hex'), purpose: 'LOGIN', expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000) },
    });
    await sendSms(phone, `Your Medical Sketcher code is ${code} (valid ${CODE_TTL_MINUTES} minutes)`);
    return { success: true, expiresInMinutes: CODE_TTL_MINUTES };
  }

  @Post('verify')
  async verify(@Req() req: Request, @Body() body: { phone?: string; code?: string }) {
    if (!body.phone || !body.code) throw new BadRequestException('Phone and code are required');
    const phone = normalizePhone(body.phone);
    const user = await this.prisma.user.findUnique({ where: { phoneNumber: phone } });
    if (!user) throw new UnauthorizedException('No account linked to this phone');
    // Brute-force guard (OWASP A07): a 6-digit code is ~10^6 keys, so failed
    // attempts are counted per code server-side; after 5 wrong entries the
    // code is dead and a new one must be requested (requests capped hourly).
    const token = await this.prisma.phoneVerificationToken.findFirst({ where: { userId: user.id, purpose: 'LOGIN', usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!token) throw new UnauthorizedException('Invalid or expired code');
    if (token.failedAttempts >= 5) throw new UnauthorizedException('Too many invalid attempts — request a new code');
    const expected = token.codeHash;
    const provided = createHash('sha256').update(body.code).digest('hex');
    const ok = expected.length === provided.length && expected === provided;
    if (!ok) {
      await this.prisma.phoneVerificationToken.update({ where: { id: token.id }, data: { failedAttempts: { increment: 1 } } });
      throw new UnauthorizedException('Invalid or expired code');
    }
    await this.prisma.phoneVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });

    await this.prisma.user.update({ where: { id: user.id }, data: { phoneVerifiedAt: new Date() } });
    const raw = (await import('node:crypto')).randomBytes(32).toString('hex');
    await this.prisma.session.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 30 * 86400000) } });
    req.res?.cookie?.(process.env.AUTH_COOKIE_NAME || 'aurelia_session', raw, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 86400000, path: '/' });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'phone-signin', entity: 'User', entityId: user.id, metadata: { method: 'phone' } as object } });
    return { id: user.id, email: user.email, name: user.name, role: user.role, phoneNumber: user.phoneNumber };
  }

  /** Attach a phone number to the signed-in account (identity for orders). */
  @UseGuards(AuthGuard)
  @Post('link')
  async link(@Req() req: Request & { user: { id: string } }, @Body() body: { phone?: string }) {
    if (!body.phone) throw new BadRequestException('Phone number is required');
    const phone = normalizePhone(body.phone);
    const clash = await this.prisma.user.findUnique({ where: { phoneNumber: phone } });
    if (clash && clash.id !== req.user.id) throw new BadRequestException('This phone number is already linked to another account');
    await this.prisma.user.update({ where: { id: req.user.id }, data: { phoneNumber: phone } });
    return { success: true, phoneNumber: phone };
  }
}
