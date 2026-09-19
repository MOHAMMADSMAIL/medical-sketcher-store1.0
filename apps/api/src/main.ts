import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { rateLimit } from './rate-limit';
import { csrfProtection } from './csrf';
import { captureError, MonitoringExceptionFilter } from './error-monitoring';
import { PrismaService } from './prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Liveness/readiness probe for hosting platforms (Fly.io health checks).
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/health', async (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) => {
    try {
      const prisma = app.get(PrismaService);
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });
  // CORS first so rejected requests (403 CSRF / 429 rate limit) still carry
  // Access-Control-Allow-Origin and the browser can surface the real message.
  app.enableCors({ origin: process.env.WEB_URL || 'http://localhost:3001', credentials: true });
  app.use(helmet());
  app.use(cookieParser());
  app.use(rateLimit);
  app.use(csrfProtection);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new MonitoringExceptionFilter());
  process.on('unhandledRejection', reason => { void captureError(reason, { source: 'unhandledRejection' }); });
  process.on('uncaughtException', error => { void captureError(error, { source: 'uncaughtException' }); });
  await app.listen(Number(process.env.API_PORT || 3000));
}
bootstrap();
