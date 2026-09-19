import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

const SECRET = /password|token|authorization|cookie|secret|hyperpay|access[_-]?key/i;
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, SECRET.test(key) ? '[REDACTED]' : redact(item)]));
  return value;
}
export async function captureError(error: unknown, context: Record<string, unknown> = {}) {
  const dsn = process.env.SENTRY_DSN;
  const exception = error instanceof Error ? error : new Error(String(error));
  const payload = { event_id: crypto.randomUUID().replace(/-/g, ''), timestamp: new Date().toISOString(), platform: 'node', level: 'error', environment: process.env.NODE_ENV || 'development', exception: { values: [{ type: exception.name, value: exception.message, stacktrace: { frames: (exception.stack || '').split('\n').map(filename => ({ filename })) } }] }, extra: redact(context) };
  console.error(JSON.stringify(payload));
  if (!dsn) return;
  try {
    const parsed = new URL(dsn); const projectId = parsed.pathname.replace(/^\//, '');
    const endpoint = `${parsed.protocol}//${parsed.host}/api/${projectId}/store/?sentry_key=${parsed.username}`;
    await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch { /* Monitoring must never take down the API. */ }
}
@Catch()
export class MonitoringExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>(); const request = host.switchToHttp().getRequest<Request>();
    const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    void captureError(error, { method: request.method, path: request.path, query: request.query, body: request.body, status });
    const payload = error instanceof HttpException ? error.getResponse() : 'Internal server error';
    const message = typeof payload === 'string' ? payload : ((payload as { message?: string }).message ?? 'Internal server error');
    response.status(status).json({ statusCode: status, message });
  }
}
