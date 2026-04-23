import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DEFAULT_PORT } from './config/constants';
import { HttpExceptionFilter } from './filters/http-exception.filter';

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
        origin === 'http://127.0.0.1:3000'
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT);
}
void bootstrap();
