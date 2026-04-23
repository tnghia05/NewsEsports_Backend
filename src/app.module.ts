import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { MongoModule } from './infra/db/mongo.module';
import { ApiV1Module } from './routes/api-v1.module';

@Module({
  imports: [
    ConfigModule,
    MongoModule,
    ApiV1Module,
    ThrottlerModule.forRoot({
      ttl: 60_000,
      limit: 200,
    }),
    RouterModule.register([{ path: 'api/v1', module: ApiV1Module }]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
