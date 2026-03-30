import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ExceptionsFilter } from './core/filters/exceptions.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );

  // Resolve CORS origins from env when provided; fall back to defaults otherwise
  const corsOriginsEnv = process.env.CORS_ORIGINS || '';
  const resolvedOrigins = corsOriginsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      // Support regex entries using either re:/regex/ syntax or plain ^...$ pattern
      if (/^re:/i.test(entry)) {
        const pattern = entry.replace(/^re:/i, '');
        try {
          return new RegExp(pattern);
        } catch {
          Logger.warn(`Invalid CORS regex pattern ignored: ${pattern}`, 'Bootstrap');
          return null;
        }
      }
      if (entry.startsWith('^') || entry.endsWith('$')) {
        try {
          return new RegExp(entry);
        } catch {
          Logger.warn(`Invalid CORS regex pattern ignored: ${entry}`, 'Bootstrap');
          return null;
        }
      }
      return entry;
    })
    .filter((entry): entry is string | RegExp => entry !== null);
  app.enableCors({
    origin: resolvedOrigins,
    preflightContinue: false,
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalFilters(new ExceptionsFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
