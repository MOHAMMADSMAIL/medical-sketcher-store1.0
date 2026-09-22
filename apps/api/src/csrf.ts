import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const cookieName = 'aurelia_csrf';
const safe = new Set(['GET', 'HEAD', 'OPTIONS']);
function same(a: string, b: string) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }

function isAllowedOrigin(origin: string): boolean {
  // Exact-match against every configured origin. A prefix check (startsWith)
  // would accept attacker hosts like `https://web-url.evil.com` — OWASP A05.
  const allowed = (process.env.WEB_URL || 'http://localhost:3001')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  let parsed: URL;
  try { parsed = new URL(origin); } catch { return false; }
  // Compare scheme+host+port only; ignore path/query the attacker controls.
  const candidate = `${parsed.protocol}//${parsed.host}`;
  return allowed.includes(candidate);
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.[cookieName]) res.cookie(cookieName, randomBytes(32).toString('hex'), { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  if (safe.has(req.method) || req.path.endsWith('/payments/webhook')) return next();
  if (!isAllowedOrigin(req.get('origin') || req.get('referer') || '')) return res.status(403).json({ message: 'Invalid request origin' });
  const token = req.get('x-csrf-token');
  if (!token || !same(token, req.cookies?.[cookieName] || '')) return res.status(403).json({ message: 'Invalid CSRF token' });
  next();
}
