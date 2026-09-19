import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';

export interface StorageProvider {
  put(key: string, data: Buffer, contentType?: string): Promise<void>;
  getStream(key: string): NodeJS.ReadableStream;
}

export function safeStorageKey(input: string) {
  const cleaned = input.normalize('NFKC').replace(/[^a-zA-Z0-9._/-]+/g, '-').replace(/\/{2,}/g, '/');
  const key = cleaned.split('/').filter((part) => part && part !== '.' && part !== '..').join('/');
  if (!key || isAbsolute(key)) throw new Error('Invalid storage key');
  return key;
}

export class LocalStorageProvider implements StorageProvider {
  // Resolve relative to the repo root (apps/api/src -> apps/api -> repo root), not __dirname: the compiled
  // file lives in dist/, which pointed writes at <repo>/../storage (outside the checkout) while reads
  // expected <repo>/storage — a split brain where uploads vanished and downloads 404'd.
  constructor(private readonly root = process.env.STORAGE_LOCAL_ROOT || resolve(__dirname, '..', '..', '..', 'storage')) {}
  private filePath(key: string) { const file = resolve(this.root, safeStorageKey(key)); if (relative(this.root, file).startsWith('..')) throw new Error('Invalid storage path'); return file; }
  async put(key: string, data: Buffer) { const file = this.filePath(key); await mkdir(join(file, '..'), { recursive: true }); await writeFile(file, data); }
  getStream(key: string) { return createReadStream(this.filePath(key)); }
}

export class SupabaseStorageProvider implements StorageProvider {
  private readonly url = process.env.SUPABASE_URL!.replace(/\/$/, '');
  private readonly key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  private readonly bucket = process.env.SUPABASE_STORAGE_BUCKET || 'books-private';
  private endpoint(path: string) { return `${this.url}/storage/v1${path}`; }
  async put(key: string, data: Buffer, contentType = 'application/octet-stream') {
    const response = await fetch(this.endpoint(`/object/${this.bucket}/${safeStorageKey(key)}`), { method: 'POST', headers: { Authorization: `Bearer ${this.key}`, apikey: this.key, 'Content-Type': contentType, 'x-upsert': 'true' }, body: data as unknown as BodyInit });
    if (!response.ok) throw new Error(`Supabase upload failed: ${response.status}`);
  }
  getStream(key: string) {
    const stream = new Readable({ read() {} });
    void this.signedUrl(key).then(async (url) => { const response = await fetch(url); if (!response.ok || !response.body) throw new Error(`Supabase download failed: ${response.status}`); Readable.fromWeb(response.body as any).on('data', (chunk) => stream.push(chunk)).on('end', () => stream.push(null)).on('error', (e) => stream.destroy(e)); }).catch((e) => stream.destroy(e));
    return stream;
  }
  async signedUrl(key: string, expiresIn = Number(process.env.STORAGE_SIGNED_URL_TTL || 300), download = false) {
    const response = await fetch(this.endpoint(`/object/sign/${this.bucket}/${safeStorageKey(key)}`), { method: 'POST', headers: { Authorization: `Bearer ${this.key}`, apikey: this.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn, ...(download ? { download: true } : {}) }) });
    if (!response.ok) throw new Error(`Supabase signed URL failed: ${response.status}`);
    const result = await response.json() as { signedURL: string };
    return `${this.url}${result.signedURL}`;
  }
}

export function createStorageProvider(): StorageProvider {
  if ((process.env.STORAGE_PROVIDER || 'local').toLowerCase() === 'supabase') {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    return new SupabaseStorageProvider();
  }
  return new LocalStorageProvider();
}

export const storageProvider = createStorageProvider();
export const storage = storageProvider;
export const storageKeyForProduct = (slug: string, media?: { storageKey: string } | null) => media?.storageKey || `books/${slug}.txt`;
export const contentDisposition = (name: string) => `attachment; filename="${name.replace(/[^a-zA-Z0-9._-]/g, '_')}"`;

export async function createSignedDownloadUrl(key: string, expiresIn = Number(process.env.STORAGE_SIGNED_URL_TTL || 300)) {
  if (!(storageProvider instanceof SupabaseStorageProvider)) return null;
  return storageProvider.signedUrl(key, expiresIn, true);
}

export { createReadStream };

export const StorageProviderVersion = 'supabase-private-v1';
