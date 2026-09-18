import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, normalize, relative, resolve } from 'node:path';
export interface StorageProvider { put(key: string, data: Buffer): Promise<void>; getStream(key: string): NodeJS.ReadableStream; }
export function safeStorageKey(input: string) {
  const cleaned = input.normalize('NFKC').replace(/[^a-zA-Z0-9._/-]+/g, '-').replace(/\/+/g, '/').replace(/\/{2,}/g, '/');
  const key = cleaned.split('/').filter((part) => part && part !== '.' && part !== '..').join('/');
  if (!key || isAbsolute(key)) throw new Error('Invalid storage key');
  return key;
}
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly root = process.env.STORAGE_LOCAL_ROOT || resolve(__dirname, '../../../storage')) {}
  private filePath(key: string) { const file = resolve(this.root, safeStorageKey(key)); if (relative(this.root, file).startsWith('..')) throw new Error('Invalid storage path'); return file; }
  async put(key: string, data: Buffer) { const file = this.filePath(key); await mkdir(join(file, '..'), { recursive: true }); await writeFile(file, data); }
  getStream(key: string) { return createReadStream(this.filePath(key)); }
}
export class S3StorageProvider implements StorageProvider {
  async put(_key: string, _data: Buffer) { throw new Error('Configure an S3 SDK adapter before selecting STORAGE_PROVIDER=s3'); }
  getStream(_key: string): NodeJS.ReadableStream { throw new Error('Configure an S3 SDK adapter before selecting STORAGE_PROVIDER=s3'); }
}
