import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

jest.setTimeout(180000);

type Res = Awaited<ReturnType<typeof fetch>>;

const PORT = 3210;
const BASE = `http://127.0.0.1:${PORT}/api`;
const ORIGIN = 'http://localhost:3001';
const DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://aurelia:change-me@localhost:5432/aurelia_test?schema=public';

let child: ReturnType<typeof spawn>;
const serverLogs: string[] = [];
const tmpDir = join(tmpdir(), `aurelia-integration-${Date.now()}`);

// In-process mock of the Upstash REST pipeline API (POST /pipeline with INCR / EXPIRE NX),
// so the real phase-3 rate-limit middleware code path is exercised end to end.
const mockStore = new Map<string, number>();
const mockTtl = new Map<string, number>();
let mockRedis: Server | undefined;
let mockRedisUrl = '';

const ctx: {
  email?: string;
  password?: string;
  userId?: string;
  csrfCookie?: string;
  csrfToken?: string;
  sessionCookie?: string;
  orderId?: string;
  paymentId?: string;
} = {};

function setCookieValue(res: Res, name: string): string | undefined {
  const cookies: string[] = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  return cookies.find(cookie => cookie.startsWith(`${name}=`))?.split(';')[0];
}

function post(path: string, body: unknown, headers: Record<string, string> = {}): Promise<Res> {
  return fetch(`${BASE}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers }, body: JSON.stringify(body) });
}

function get(path: string, headers: Record<string, string> = {}): Promise<Res> {
  return fetch(`${BASE}${path}`, { headers: { origin: ORIGIN, ...headers } });
}

function csrfHeaders(): Record<string, string> {
  return { cookie: [ctx.csrfCookie, ctx.sessionCookie].filter(Boolean).join('; '), 'x-csrf-token': ctx.csrfToken || '' };
}

async function waitFor(predicate: () => boolean, timeoutMs = 15000, everyMs = 250): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, everyMs));
  }
  throw new Error('condition not met in time');
}

function errorPayloads(): Array<Record<string, any>> {
  return serverLogs
    .join('')
    .split('\n')
    .filter(line => line.includes('"level":"error"'))
    .map(line => {
      try { return JSON.parse(line) as Record<string, any>; } catch { return undefined; }
    })
    .filter(Boolean) as Array<Record<string, any>>;
}

beforeAll(async () => {
  // Self-sufficient suite: ALWAYS create its own published product instead of
  // mutating whatever happens to be in the shared database (root fix: the suite
  // must never depend on seed data — the demo catalog was removed on purpose).
  const db = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
  const anyCategory = await db.category.findFirst({ orderBy: { name: 'asc' } });
  if (!anyCategory) {
    await db.category.create({ data: { name: 'Test', slug: 'cefr-test-fallback' } });
  }
  const category = await db.category.findFirstOrThrow({ orderBy: { name: 'asc' } });
  await db.product.upsert({
    where: { slug: 'e2e-self-made-book' },
    update: { status: 'PUBLISHED' },
    create: {
      title: 'E2E Self-Made Book',
      slug: 'e2e-self-made-book',
      description: 'Created by the integration suite itself; safe to delete.',
      price: 9.9,
      status: 'PUBLISHED',
      type: 'book',
      categoryId: category.id,
    },
  });
  await db.$disconnect();

  mockRedis = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/pipeline') {
      let body = '';
      req.on('data', chunk => { body += String(chunk); });
      req.on('end', () => {
        const commands = JSON.parse(body) as string[][];
        const results = commands.map(command => {
          if (command[0] === 'INCR') {
            mockStore.set(command[1], (mockStore.get(command[1]) || 0) + 1);
            return { result: mockStore.get(command[1]) };
          }
          if (command[0] === 'EXPIRE' && command[2] === 'NX') {
            if (!mockTtl.has(command[1])) mockTtl.set(command[1], Number(command[3]));
            return { result: 1 };
          }
          return { result: null };
        });
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(results));
      });
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  await new Promise<void>(resolve => mockRedis!.listen(0, '127.0.0.1', resolve));
  mockRedisUrl = `http://127.0.0.1:${(mockRedis.address() as { port: number }).port}`;

  child = spawn(process.execPath, [join(__dirname, '..', 'dist', 'main.js')], {
    cwd: join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      API_PORT: String(PORT),
      WEB_URL: ORIGIN,
      DATABASE_URL,
      EMAIL_PROVIDER: 'console',
      PAYMENT_PROVIDER: 'development',
      UPSTASH_REDIS_REST_URL: mockRedisUrl,
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
      SENTRY_DSN: '',
      STORAGE_LOCAL_ROOT: tmpDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', chunk => serverLogs.push(String(chunk)));
  child.stderr?.on('data', chunk => serverLogs.push(String(chunk)));
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/products`);
      if (res.ok) {
        const cookie = setCookieValue(res, 'aurelia_csrf');
        if (cookie) {
          ctx.csrfCookie = cookie;
          ctx.csrfToken = cookie.split('=')[1];
        }
        return;
      }
    } catch { /* not up yet */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`API did not become ready. Logs:\n${serverLogs.join('')}`);
});

afterAll(async () => {
  child?.kill('SIGTERM');
  await new Promise<void>(resolve => mockRedis?.close(() => resolve()));
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('Phase 1-5 integration: rate limit -> CSRF -> app -> monitoring -> email', () => {
  it('layer 0: public catalog answers without CSRF and still gets a csrf cookie seeded (safe method)', async () => {
    const res = await fetch(`${BASE}/products`);
    expect(res.status).toBe(200);
    const data = await res.json() as Array<{ id: string }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(setCookieValue(res, 'aurelia_csrf') ?? ctx.csrfCookie).toBeDefined();
  });

  it('layer 1+2: register passes rate limiter and CSRF, issues csrf cookie, no secret echoed', async () => {
    ctx.email = `integration+${Date.now()}@aurelia.test`;
    ctx.password = 'Test12345!';
    const res = await post('/auth/register', { email: ctx.email, password: ctx.password, name: 'Integration Tester' }, { cookie: ctx.csrfCookie || '', 'x-csrf-token': ctx.csrfToken || '' });
    expect(res.status).toBe(201);
    ctx.csrfCookie = setCookieValue(res, 'aurelia_csrf') ?? ctx.csrfCookie;
    ctx.csrfToken = ctx.csrfCookie?.split('=')[1];
    expect(ctx.csrfCookie).toBeDefined();
    const user = await res.json() as { id?: string; passwordHash?: string };
    expect(user.id).toBeDefined();
    ctx.userId = user.id;
    expect(user.passwordHash).toBeUndefined();
    expect(JSON.stringify(user)).not.toContain(ctx.password);
  });

  it('layer 2 (negative): state-changing POST without CSRF token is rejected with 403', async () => {
    const res = await post('/auth/login', { identifier: ctx.email, password: ctx.password }, { cookie: ctx.csrfCookie || '' });
    expect(res.status).toBe(403);
    const data = await res.json() as { message?: string };
    expect(data.message).toBe('Invalid CSRF token');
  });

  it('layer 1: register rate limit returns 429 once the per-minute quota is exhausted', async () => {
    mockStore.clear();
    mockTtl.clear();
    const headers = { cookie: ctx.csrfCookie || '', 'x-csrf-token': ctx.csrfToken || '' };
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await post('/auth/register', { email: `integration+${Date.now()}-${attempt}@aurelia.test`, password: 'Test12345!' }, headers);
      statuses.push(res.status);
    }
    expect(statuses).toEqual([201, 201, 201]);
    const fourth = await post('/auth/register', { email: `integration+${Date.now()}-x@aurelia.test`, password: 'Test12345!' }, headers);
    expect(fourth.status).toBe(429);
    const data = await fourth.json() as { message?: string };
    expect(data.message).toBe('Too many requests');
  });

  it('layer 2 (positive): login with matching CSRF token sets httpOnly session cookie', async () => {
    const res = await post('/auth/login', { identifier: ctx.email, password: ctx.password }, { cookie: ctx.csrfCookie || '', 'x-csrf-token': ctx.csrfToken || '' });
    expect([200, 201]).toContain(res.status);
    const user = await res.json() as { email?: string };
    expect(user.email).toBe(ctx.email);
    ctx.sessionCookie = setCookieValue(res, 'aurelia_session');
    expect(ctx.sessionCookie).toBeDefined();
  });

  it('layers 1+2+5: cart -> order passes limiter/CSRF and sends order-confirmation email through provider', async () => {
    const catalog = await fetch(`${BASE}/products`);
    const products = await catalog.json() as Array<{ id: string }>;
    const cart = await post('/cart/items', { productId: products[0].id, quantity: 1 }, csrfHeaders());
    expect(cart.status).toBe(201);
    const order = await post('/orders', {}, csrfHeaders());
    expect(order.status).toBe(201);
    const data = await order.json() as { id: string; total: string; status: string; items: unknown[] };
    ctx.orderId = data.id;
    expect(Number(data.total)).toBeGreaterThan(0);
    expect(data.status).toBe('PENDING');
    expect(data.items.length).toBe(1);
    await waitFor(() => serverLogs.join('').includes(`[email:console] order-confirmation -> ${ctx.email}`));
  });

  it('layer 5: payment confirm goes through provider, succeeds, sends payment + download emails', async () => {
    const created = await post('/payments/create', { orderId: ctx.orderId }, csrfHeaders());
    expect(created.status).toBe(201);
    const payment = await created.json() as { id: string; checkoutId?: string; status: string };
    ctx.paymentId = payment.id;
    expect(payment.checkoutId).toBeDefined();
    expect(payment.status).toBe('CREATED');
    const confirmed = await post(`/payments/${ctx.paymentId}/confirm`, {}, csrfHeaders());
    expect(confirmed.status).toBe(201);
    const result = await confirmed.json() as { status: string; transactionId?: string; resultCode?: string };
    expect(result.status).toBe('SUCCEEDED');
    expect(result.transactionId?.startsWith('dev_tx_')).toBe(true);
    expect(result.resultCode).toBe('000.000.000');
    const logs = () => serverLogs.join('');
    await waitFor(() => logs().includes(`[email:console] payment-confirmation -> ${ctx.email}`) && logs().includes(`[email:console] download-ready -> ${ctx.email}`));
  });

  it('layer 4: forced app error is captured with redacted payload and no credentials leaked', async () => {
    const before = errorPayloads().length;
    const res = await post('/payments/webhook', { paymentId: '00000000-0000-0000-0000-000000000000' }, { 'x-webhook-secret': process.env.PAYMENT_WEBHOOK_SECRET || 'dev-webhook-secret' });
    expect(res.status).toBe(404);
    const response = await res.json() as { message?: string };
    expect(response.message).toBe('Payment not found');
    await waitFor(() => errorPayloads().length > before);
    const payload = errorPayloads()[errorPayloads().length - 1];
    expect(payload.exception.values[0].value).toBe('Payment not found');
    expect(Array.isArray(payload.exception.values[0].stacktrace.frames)).toBe(true);
    expect(payload.extra.path).toContain('/payments/webhook');
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(ctx.password!);
    expect(ctx.sessionCookie && !serialized.includes(ctx.sessionCookie)).toBe(true);
  });
});

describe('Items 6-9: DRM, Owner DTO validation, archive, audit coverage', () => {
  let ownerSession: string | undefined;
  let ownerCsrfCookie: string | undefined;
  let ownerToken: string | undefined;
  let productId = '';

  function ownerHeaders(): Record<string, string> {
    return { cookie: [ownerCsrfCookie, ownerSession].filter(Boolean).join('; '), 'x-csrf-token': ownerToken || '' };
  }

  it('owner logs in (seeded account) and sees the library management route', async () => {
    const res = await post('/auth/login', { identifier: 'owner@aurelia.test', password: 'ChangeMe123!' }, csrfHeaders());
    expect([200, 201]).toContain(res.status);
    ownerSession = setCookieValue(res, 'aurelia_session');
    ownerCsrfCookie = setCookieValue(res, 'aurelia_csrf') ?? ctx.csrfCookie;
    ownerToken = ownerCsrfCookie?.split('=')[1];
    expect(ownerSession).toBeDefined();
    const library = await get('/owner/library', ownerHeaders());
    expect(library.status).toBe(200);
  });

  it('item 7: invalid Owner payloads are rejected by DTO validation (400), and a valid update passes', async () => {
    const catalog = await get('/products');
    const products = await catalog.json() as Array<{ id: string }>;
    productId = products[0].id;
    const badPrice = await fetch(`${BASE}/owner/products/${productId}`, { method: 'PATCH', headers: { 'content-type': 'application/json', origin: ORIGIN, ...ownerHeaders() }, body: JSON.stringify({ price: 'not-a-number' }) });
    expect(badPrice.status).toBe(400);
    const emptyBook = await post('/owner/books', {}, ownerHeaders());
    expect(emptyBook.status).toBe(400);

    // a valid update (also feeds the audit-coverage assertion later)
    const update = await fetch(`${BASE}/owner/products/${productId}`, { method: 'PATCH', headers: { 'content-type': 'application/json', origin: ORIGIN, ...ownerHeaders() }, body: JSON.stringify({ description: `Integration update ${Date.now()}` }) });
    expect([200, 201]).toContain(update.status);
  });

  it('item 6: grant with limit, watermarked downloads, count enforcement, IP/UA logs', async () => {
    // fresh counter state but keep the payment-issued orderId (repeatable on a persistent db)
    const db = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
    await db.downloadPermission.upsert({
      where: { userId_productId: { userId: ctx.userId!, productId } },
      update: { downloadCount: 0, revokedAt: null },
      create: { userId: ctx.userId!, productId, orderId: ctx.orderId, maxDownloads: 2 },
    });
    await db.$disconnect();

    // upload a small primary book file so the download stream has content
    const form = new FormData();
    form.append('file', new Blob(['Aurelia sample book content'], { type: 'text/plain' }), 'sample-book.txt');
    form.append('fileType', 'book');
    const upload = await fetch(`${BASE}/owner/books/${productId}/upload`, { method: 'POST', headers: { origin: ORIGIN, ...ownerHeaders() }, body: form });
    if (upload.status !== 201) console.error('UPLOAD_FAILED_LOGS:\n', serverLogs.slice(-25).join(''));
    expect(upload.status).toBe(201);

    const grant = await post(`/owner/users/${ctx.userId}/library/${productId}`, { maxDownloads: 2 }, ownerHeaders());
    expect(grant.status).toBe(201);
    const granted = await grant.json() as { maxDownloads: number | null; downloadCount: number };
    expect(granted.maxDownloads).toBe(2);

    // customer downloads twice, gets watermarked copies
    const customerCookie = { cookie: ctx.sessionCookie || '' };
    const first = await get(`/downloads/${productId}`, customerCookie);
    expect(first.status).toBe(200);
    const firstText = await first.text();
    expect(firstText).toContain('Aurelia sample book content');
    expect(firstText).toContain(ctx.email!);
    expect(firstText).toContain(ctx.orderId!);
    const second = await get(`/downloads/${productId}`, customerCookie);
    expect(second.status).toBe(200);
    // third attempt exceeds the limit of 2
    const third = await get(`/downloads/${productId}`, customerCookie);
    expect(third.status).toBe(403);

    // logs recorded with ip and user-agent
    const logsRes = await get(`/owner/users/${ctx.userId}/downloads/${productId}/logs`, ownerHeaders());
    expect(logsRes.status).toBe(200);
    const logsData = await logsRes.json() as { permission: { downloadCount: number; maxDownloads: number | null }; logs: Array<{ ip: string | null; userAgent: string | null }> };
    expect(logsData.permission.downloadCount).toBe(2);
    expect(logsData.logs.length).toBe(2);
    expect(logsData.logs.every(log => typeof log.ip === 'string' && log.ip.length > 0)).toBe(true);
    expect(logsData.logs.every(log => typeof log.userAgent === 'string' && log.userAgent.length > 0)).toBe(true);
  });

  it('item 6: revoke blocks downloads immediately, restore re-enables state', async () => {
    const revoke = await fetch(`${BASE}/owner/users/${ctx.userId}/library/${productId}`, { method: 'DELETE', headers: { origin: ORIGIN, ...ownerHeaders() } });
    expect(revoke.status).toBe(200);
    const blocked = await get(`/downloads/${productId}`, { cookie: ctx.sessionCookie || '' });
    expect(blocked.status).toBe(403);
    const restored = await post(`/owner/users/${ctx.userId}/library/${productId}/restore`, {}, ownerHeaders());
    expect(restored.status).toBe(201);
  });

  it('item 8: archive is a real ARCHIVED state, hidden from catalog, restorable', async () => {
    const before = await get(`/owner/books/${productId}`, ownerHeaders());
    const originalStatus = ((await before.json()) as { status: string }).status;

    const archive = await post(`/owner/books/${productId}/archive`, {}, ownerHeaders());
    expect(archive.status).toBe(201);
    const archived = await archive.json() as { status: string; archivedAt: string | null };
    expect(archived.status).toBe('ARCHIVED');
    expect(archived.archivedAt).toBeTruthy();

    const catalog = await get('/products');
    const products = await catalog.json() as Array<{ id: string }>;
    expect(products.some(product => product.id === productId)).toBe(false);

    const restore = await post(`/owner/books/${productId}/restore`, {}, ownerHeaders());
    expect(restore.status).toBe(201);
    const restored = await restore.json() as { status: string; archivedAt: string | null };
    expect(restored.status).toBe('DRAFT');
    expect(restored.archivedAt).toBeNull();

    // keep the suite repeatable: return the product to its pre-test status
    if (originalStatus === 'PUBLISHED') {
      const republish = await post(`/owner/books/${productId}/publish`, {}, ownerHeaders());
      expect(republish.status).toBe(201);
    }
  });

  it('item 9: audit log contains entries for the mutations performed above', async () => {
    const res = await get('/owner/audit?limit=50', ownerHeaders());
    expect(res.status).toBe(200);
    const entries = await res.json() as Array<{ action: string; entity: string }>;
    const actions = entries.map(entry => entry.action);
    expect(actions).toContain('grant');
    expect(actions).toContain('revoke');
    expect(actions).toContain('restore');
    expect(actions).toContain('archive');
    expect(actions).toContain('update');
  });
});
