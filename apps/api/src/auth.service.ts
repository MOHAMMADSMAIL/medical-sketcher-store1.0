import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';
import { createEmailProvider, EmailProvider } from './email.provider';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
@Injectable()
export class AuthService {
  private readonly email: EmailProvider = createEmailProvider();
  constructor(private readonly prisma: PrismaService) {}
  private ownerEmail() { return (process.env.OWNER_EMAIL || `${process.env.OWNER_USERNAME || 'owner'}@medicalsketcher.local`).toLowerCase(); }
  private async ensureConfiguredOwner() {
    const username = process.env.OWNER_USERNAME;
    const password = process.env.OWNER_PASSWORD;
    if (!username || !password) return null;
    if (password.length < 8) throw new Error('OWNER_PASSWORD must be at least 8 characters');
    const passwordHash = await bcrypt.hash(password, 12);
    return this.prisma.user.upsert({
      where: { email: this.ownerEmail() },
      update: { name: username, role: 'OWNER', passwordHash },
      create: { email: this.ownerEmail(), name: username, role: 'OWNER', passwordHash },
    });
  }
  async register(email: string, password: string, name?: string) {
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
    const passwordHash = await bcrypt.hash(password, 12);
    try { return await this.prisma.user.create({ data: { email: email.toLowerCase(), name, passwordHash }, select: { id: true, email: true, name: true, role: true } }); }
    catch { throw new BadRequestException('Email is already registered'); }
  }
  async login(identifier: string, password: string) {
    const configuredOwner = await this.ensureConfiguredOwner();
    const normalized = identifier.trim().toLowerCase();
    const ownerUsername = (process.env.OWNER_USERNAME || '').trim().toLowerCase();
    const email = ownerUsername && normalized === ownerUsername ? this.ownerEmail() : normalized;
    const user = configuredOwner && email === configuredOwner.email ? configuredOwner : await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    const raw = randomBytes(32).toString('hex');
    await this.prisma.session.create({ data: { userId: user.id, tokenHash: hash(raw), expiresAt: new Date(Date.now() + 30 * 86400000) } });
    return { token: raw, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
  async fromToken(raw?: string) {
    if (!raw) return null;
    const session = await this.prisma.session.findUnique({ where: { tokenHash: hash(raw) }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) { if (session) await this.prisma.session.delete({ where: { id: session.id } }); return null; }
    return session.user;
  }
  async logout(raw?: string) { if (raw) await this.prisma.session.deleteMany({ where: { tokenHash: hash(raw) } }); }
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return;
    const raw = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash(raw), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    const web = (process.env.WEB_URL || 'http://localhost:3001').replace(/\/$/, '');
    await this.email.send({ to: user.email, template: 'password-reset', variables: { resetUrl: `${web}/reset-password?token=${encodeURIComponent(raw)}`, expiresIn: '60 minutes' } });
  }
  async resetPassword(token: string, password: string) {
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
    const reset = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(token) } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) throw new BadRequestException('Invalid or expired reset token');
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      this.prisma.session.deleteMany({ where: { userId: reset.userId } }),
    ]);
  }
}
