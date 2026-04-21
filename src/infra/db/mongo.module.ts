import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', { infer: true }),
        lazyConnection: true,
        serverSelectionTimeoutMS: 2000,
        connectionFactory: (connection: Connection) => {
          connection.on('error', (err: unknown) => {
            // Keep the app running even if Mongo is down.
            // In dev you can start Mongo later and restart the app.

            console.warn('[Mongo] connection error:', err);
          });
          return connection;
        },
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
