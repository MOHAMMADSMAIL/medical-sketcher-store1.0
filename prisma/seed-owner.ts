/**
 * Owner bootstrap (run once per machine, never committed with secrets).
 *
 * Usage:  OWNER_PASSWORD='<secret>' npx tsx prisma/seed-owner.ts
 *
 * - Password is bcrypt-hashed at creation time only; it is never stored
 *   anywhere in code, logs, or the repository.
 * - Idempotent: if the owner already exists, nothing is changed (an existing
 *   owner's password may have been rotated from the dashboard).
 * - To rotate later: OWNER_PASSWORD='<new>' FORCE_OWNER_RESET=1 npx tsx prisma/seed-owner.ts
 *   (required if you ever lose the dashboard password).
 * - Requires OWNER_USERNAME/OWNER_EMAIL in .env (values live in .env only).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

loadDotenv({ path: resolve(process.cwd(), '.env') });

async function main() {
  const username = (process.env.OWNER_USERNAME || '').trim();
  const password = process.env.OWNER_PASSWORD || '';
  const email = (process.env.OWNER_EMAIL || `${username}@medicalsketcher.local`).toLowerCase();
  if (!username || !password) {
    console.error('OWNER_USERNAME / OWNER_PASSWORD required (set in .env).');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('OWNER_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && !process.env.FORCE_OWNER_RESET) {
      console.log(`Owner "${username}" already exists — left untouched.`);
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { name: username, role: 'OWNER', passwordHash } });
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      console.log(`Owner "${username}" password reset. All sessions revoked.`);
      return;
    }
    await prisma.user.create({ data: { email, name: username, role: 'OWNER', passwordHash } });
    console.log(`Owner "${username}" created.`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
