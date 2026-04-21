import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from '../controllers/health.controller';
import { HealthService } from '../services/health.service';
import { UserModelName, UserSchema } from '../models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserModelName, schema: UserSchema }]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class ApiV1Module {}
