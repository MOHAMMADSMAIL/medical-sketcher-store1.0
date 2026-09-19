import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'books-private';
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

for (const product of await prisma.product.findMany()) {
  const local = resolve(process.cwd(), 'storage/books', `${product.slug}.txt`);
  try {
    const data = await readFile(local);
    const storageKey = `books/${product.slug}.txt`;
    const response = await fetch(`${url}/storage/v1/object/${bucket}/${storageKey}`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'text/plain', 'x-upsert': 'true' }, body: data as unknown as BodyInit });
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
    await prisma.media.upsert({ where: { id: `seed-${product.id}` }, update: { storageKey, originalName: `${product.slug}.txt`, mimeType: 'text/plain', size: data.byteLength, isPrimary: true, productId: product.id }, create: { id: `seed-${product.id}`, storageKey, originalName: `${product.slug}.txt`, mimeType: 'text/plain', size: data.byteLength, isPrimary: true, productId: product.id } });
    console.log(`uploaded ${product.slug}`);
  } catch (error) { console.warn(`skipped ${product.slug}:`, error); }
}
await prisma.$disconnect();
