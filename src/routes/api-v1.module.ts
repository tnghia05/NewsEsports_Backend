import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from '../controllers/health.controller';
import { AuthController } from '../controllers/auth.controller';
import { UsersController } from '../controllers/users.controller';
import { HealthService } from '../services/health.service';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { UserModelName, UserSchema } from '../models/user.model';
import { JwtStrategy } from '../infra/auth/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserModelName, schema: UserSchema }]),
  ],
  controllers: [HealthController, AuthController, UsersController],
  providers: [HealthService, UsersService, AuthService, JwtStrategy],
})
export class ApiV1Module {}
