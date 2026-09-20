/**
 * Store reset (task 5): remove the demo book catalog and prepare the
 * CEFR level structure (A1..C2) as real store categories.
 *
 * - Deletes the four demo books and their media/carts/wishlists/orders-less data.
 *   Orders are business records: if a demo book was ever purchased, the product
 *   is kept but unpublished instead of deleted (protected by FK constraints).
 * - Creates the six CEFR level sections (A1..C2) as categories, ready for real content.
 * - Never touches real merch items created from the dashboard.
 *
 * Usage: DATABASE_URL=… npx tsx prisma/seed-store-reset.ts [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

loadDotenv({ path: resolve(process.cwd(), '.env') });

const DEMO_SLUGS = ['art-of-war', 'meditations', 'pride-and-prejudice', 'great-gatsby'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaClient();
  try {
    const demo = await prisma.product.findMany({ where: { slug: { in: DEMO_SLUGS } }, select: { id: true, title: true, slug: true } });
    console.log(`Demo books found: ${demo.map((d) => d.slug).join(', ') || 'none'}`);

    for (const product of demo) {
      const sold = await prisma.orderItem.count({ where: { productId: product.id } });
      if (sold > 0) {
        console.log(`KEEP (has sales records): ${product.slug} — unpublished instead of deleted`);
        if (!dryRun) await prisma.product.update({ where: { id: product.id }, data: { status: 'DRAFT' } });
        continue;
      }
      if (dryRun) { console.log(`WOULD DELETE: ${product.slug}`); continue; }
      await prisma.$transaction([
        prisma.cartItem.deleteMany({ where: { productId: product.id } }),
        prisma.wishlistItem.deleteMany({ where: { productId: product.id } }),
        prisma.review.deleteMany({ where: { productId: product.id } }),
        prisma.downloadPermission.deleteMany({ where: { productId: product.id } }),
        prisma.downloadLog.deleteMany({ where: { productId: product.id } }),
        prisma.media.deleteMany({ where: { productId: product.id } }),
        prisma.product.delete({ where: { id: product.id } }),
      ]);
      console.log(`DELETED: ${product.slug}`);
    }

    for (const level of LEVELS) {
      const existing = await prisma.category.findUnique({ where: { slug: `cefr-${level.toLowerCase()}` } });
      if (existing) { console.log(`SECTION EXISTS: ${level}`); continue; }
      if (dryRun) { console.log(`WOULD CREATE SECTION: ${level}`); continue; }
      await prisma.category.create({ data: { name: `German ${level}`, slug: `cefr-${level.toLowerCase()}` } });
      console.log(`SECTION CREATED: ${level} (German ${level})`);
    }

    const remaining = await prisma.product.count();
    const sections = await prisma.category.count({ where: { slug: { startsWith: 'cefr-' } } });
    console.log(`\nDone. Products remaining: ${remaining}. CEFR sections: ${sections}/6.`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
