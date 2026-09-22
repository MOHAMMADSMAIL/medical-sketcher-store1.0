import type { NextFunction, Request, Response } from 'express';

function policy(path: string): readonly [number, number] {
  if (/\/auth\/login/.test(path)) return [5, 60];
  if (/\/auth\/register/.test(path)) return [3, 60];
  // Payment webhooks arrive as bursts from the provider gateway — a generous
  // burst allowance, not the interactive /payments limit (OWASP A04/A07).
  if (/\/payments\/webhook$/.test(path)) return [120, 60];
  if (/\/payments/.test(path)) return [10, 60];
  // OTP verification is the brute-force target for 6-digit codes.
  if (/\/auth\/phone\/verify/.test(path)) return [10, 60];
  if (/\/owner/.test(path)) return [60, 60];
  return [180, 60];
}

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const endpoint = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!endpoint || !token) {
    if (process.env.NODE_ENV === 'production') return res.status(503).json({ message: 'Rate limiting is not configured' });
    return next();
  }
  const [limit, seconds] = policy(req.path);
  const key = `aurelia:ratelimit:${req.path}:${req.ip}`;
  try {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/pipeline`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['INCR', key], ['EXPIRE', key, seconds, 'NX']]),
    });
    const result = await response.json() as Array<{ result?: number }>;
    const count = result[0]?.result;
    if (!response.ok || typeof count !== 'number') throw new Error('Redis counter unavailable');
    res.setHeader('X-RateLimit-Limit', String(limit));
    if (count > limit) return res.status(429).json({ message: 'Too many requests' });
    return next();
  } catch {
    return res.status(503).json({ message: 'Rate limiting temporarily unavailable' });
  }
}
