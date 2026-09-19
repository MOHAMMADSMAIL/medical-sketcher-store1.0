import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { rateLimit } from './rate-limit';
import { csrfProtection } from './csrf';
import { captureError, MonitoringExceptionFilter } from './error-monitoring';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
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
