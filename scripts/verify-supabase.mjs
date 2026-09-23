/**
 * Post-Supabase-setup verification (run after the owner fills .env).
 * Zero secrets in output — every credential-bearing string is masked.
 *
 *   node scripts/verify-supabase.mjs
 *
 * Checks:
 *   1. DATABASE_URL present + reachable (SELECT 1 via prisma)
 *   2. prisma migrate deploy (applies all pending migrations in order)
 *   3. STORAGE_PROVIDER=supabase → upload → signed URL → fetch → delete
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── load repo .env (never overrides real env vars) ──────────────────────────
const envPath = resolve(process.cwd(), '.env');
let env = {};
try {
  env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_][A-Z0-9_]*=/.test(line))
      .map((line) => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }),
  );
} catch { /* fall through to process env */ }
const val = (k) => process.env[k] || env[k] || '';
const mask = (s) => (s ? `${String(s).slice(0, 12)}…<masked>` : '(missing)');
const maskUrl = (s) => String(s || '').replace(/:\/\/([^:@/]+):([^@/]+)@/, '://$1:<masked>@');

let failures = 0;
const ok = (name) => console.log(`✅ ${name}`);
const fail = (name, detail = '') => { failures++; console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`); };

// ── 1. database reachability ────────────────────────────────────────────────
// Priority: DATABASE_URL_SUPABASE (owner-provided production URL, any mode)
// > DATABASE_URL_POOLED > DATABASE_URL. The local dev DB URL stays untouched
// so e2e keeps running against Docker.
const dbUrl = val('DATABASE_URL_SUPABASE') || val('DATABASE_URL_POOLED') || val('DATABASE_URL');
if (!dbUrl) fail('DATABASE_URL*', 'no Supabase or local URL found in .env');
else {
  console.log(`DB target: ${/supabase/i.test(dbUrl) ? 'SUPABASE (production)' : 'local dev'} — ${maskUrl(dbUrl)}`);
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try { await prisma.$queryRaw`SELECT 1`; ok('database reachable (SELECT 1)'); }
  catch (e) { fail('database reachable', String(e.message).slice(0, 160)); }
  finally { await prisma.$disconnect(); }
}

// ── 2. migrations ───────────────────────────────────────────────────────────
if (dbUrl) {
  const { execSync } = await import('node:child_process');
  try {
    const out = execSync('npx prisma migrate deploy --schema prisma/schema.prisma', {
      env: { ...process.env, DATABASE_URL: dbUrl }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 180000,
    });
    const applied = [...out.matchAll(/applying migration[s]?[^\n]*/gi)].map((m) => m[0]);
    console.log(applied.length ? applied.join('\n') : out.split(/\r?\n/).filter((l) => /migration|applied|up to date/i.test(l)).slice(0, 4).join('\n'));
    ok('prisma migrate deploy');
  } catch (e) { fail('prisma migrate deploy', String(e.stderr || e.message).replace(dbUrl, '<masked>').slice(0, 200)); }
}

// ── 3. storage round-trip ───────────────────────────────────────────────────
const sUrl = val('SUPABASE_URL'); const sKey = val('SUPABASE_SERVICE_ROLE_KEY'); const bucket = val('SUPABASE_STORAGE_BUCKET') || 'books-private';
if ((val('STORAGE_PROVIDER') || '').toLowerCase() !== 'supabase') {
  console.log('ℹ️  STORAGE_PROVIDER != supabase — skipping storage round-trip');
} else if (!sUrl || !sKey) {
  fail('storage credentials', 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
} else {
  console.log(`SUPABASE_URL: ${mask(sUrl)}  bucket: ${bucket}  key: ${mask(sKey)}`);
  const base = `${sUrl.replace(/\/$/, '')}/storage/v1`;
  const headers = { Authorization: `Bearer ${sKey}`, apikey: sKey };
  const probe = `verify-${Date.now()}.txt`;
  try {
    const up = await fetch(`${base}/object/${bucket}/${probe}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'text/plain', 'x-upsert': 'true' }, body: 'aurelia-verify' });
    if (!up.ok) throw new Error(`upload ${up.status}`);
    ok(`storage upload (${bucket}/${probe})`);
    const sign = await fetch(`${base}/object/sign/${bucket}/${probe}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }) });
    if (!sign.ok) throw new Error(`sign ${sign.status}`);
    const { signedURL } = await sign.json();
    const dl = await fetch(`${sUrl.replace(/\/$/, '')}${signedURL}`);
    if (!dl.ok) throw new Error(`download ${dl.status}`);
    if ((await dl.text()) !== 'aurelia-verify') throw new Error('content mismatch');
    ok('signed URL round-trip (content verified)');
  } catch (e) { fail('storage round-trip', `${e.message} — is the bucket "${bucket}" created and private?`); }
  finally {
    await fetch(`${base}/object/${bucket}/${probe}`, { method: 'DELETE', headers }).catch(() => {});
  }
}

console.log(failures ? `\n❌ ${failures} check(s) failed — fix .env and re-run` : '\n✅ all Supabase checks passed');
process.exit(failures ? 1 : 0);
