import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
    const user = await res.json() as Record<string, unknown>;
    expect(user.id).toBeDefined();
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
    expect(result.transactionId?.startsWith('dev_txn_')).toBe(true);
    expect(result.resultCode).toBe('000.100.110');
    const logs = () => serverLogs.join('');
    await waitFor(() => logs().includes(`[email:console] payment-confirmation -> ${ctx.email}`) && logs().includes(`[email:console] download-ready -> ${ctx.email}`));
  });

  it('layer 4: forced app error is captured with redacted payload and no credentials leaked', async () => {
    const before = errorPayloads().length;
    const res = await post('/payments/webhook', { paymentId: '00000000-0000-0000-0000-000000000000' });
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
