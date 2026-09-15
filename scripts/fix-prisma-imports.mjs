import { readFile, writeFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
const dir = '/home/ubuntu/aurelia-books-final/apps/api/src';
for (const file of await readdir(dir)) {
  if (!file.endsWith('.ts') || file === 'app.module.ts' || file === 'prisma.service.ts') continue;
  const path = `${dir}/${file}`;
  let text = await readFile(path, 'utf8');
  if (text.includes("from './app.module'")) { text = text.replaceAll("from './app.module'", "from './prisma.service'"); await writeFile(path, text); }
}
let app = await readFile(`${dir}/app.module.ts`, 'utf8');
app = app.replace("import { Module, OnModuleDestroy, OnModuleInit, Injectable } from '@nestjs/common';\nimport { PrismaClient } from '@prisma/client';", "import { Module } from '@nestjs/common';\nimport { PrismaService } from './prisma.service';");
const start = app.indexOf('@Injectable()');
const end = app.indexOf('@Module({ providers:', start);
if (start >= 0 && end >= 0) app = app.slice(0, start) + app.slice(end);
await writeFile(`${dir}/app.module.ts`, app);
