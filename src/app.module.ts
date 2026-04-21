import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { MongoModule } from './infra/db/mongo.module';
import { ApiV1Module } from './routes/api-v1.module';

@Module({
  imports: [
    ConfigModule,
    MongoModule,
    ApiV1Module,
    RouterModule.register([{ path: 'api/v1', module: ApiV1Module }]),
  ],
})
export class AppModule {}
