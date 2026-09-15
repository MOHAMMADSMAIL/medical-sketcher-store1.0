import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
export interface StorageProvider { put(key: string, data: Buffer): Promise<void>; getStream(key: string): NodeJS.ReadableStream; }
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly root = process.env.STORAGE_LOCAL_ROOT || resolve(__dirname, '../../../storage')) {}
  async put(key: string, data: Buffer) { const file = join(this.root, key); await mkdir(join(file, '..'), { recursive: true }); await writeFile(file, data); }
  getStream(key: string) { return createReadStream(join(this.root, key)); }
}
export class S3StorageProvider implements StorageProvider {
  async put(_key: string, _data: Buffer) { throw new Error('Configure an S3 SDK adapter before selecting STORAGE_PROVIDER=s3'); }
  getStream(_key: string): NodeJS.ReadableStream { throw new Error('Configure an S3 SDK adapter before selecting STORAGE_PROVIDER=s3'); }
}
