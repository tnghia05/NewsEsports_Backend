import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';

import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

import { DEFAULT_PORT } from './config/constants';

import { HttpExceptionFilter } from './filters/http-exception.filter';

import { CorsIoAdapter } from './socket/cors-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow same-origin / server-to-server calls

      if (!origin) return callback(null, true);

      // Local dev frontends

      if (
        origin === 'http://localhost:5173' ||
        origin === 'http://localhost:3000' ||
        origin === 'http://127.0.0.1:5173' ||
        origin === 'http://127.0.0.1:56231' ||
        origin === 'http://localhost:5623' ||
        origin === 'http://localhost:5000' ||
        origin === 'http://localhost:5175' ||
        origin === 'http://127.0.0.1:5175' ||
        origin === 'https://tnghia05.github.io'
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },

    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      transform: true,

      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useWebSocketAdapter(new CorsIoAdapter(app));

  await app.listen(process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT);
}

void bootstrap();
