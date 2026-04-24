import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from '../controllers/health.controller';
import { AuthController } from '../controllers/auth.controller';
import { MeController } from '../controllers/me.controller';
import { UsersController } from '../controllers/users.controller';
import { PostsController } from '../controllers/posts.controller';
import { CommentsController } from '../controllers/comments.controller';
import { HealthService } from '../services/health.service';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { PostsService } from '../services/posts.service';
import { FollowsService } from '../services/follows.service';
import { CommentsService } from '../services/comments.service';
import { UserModelName, UserSchema } from '../models/user.model';
import {
  RefreshTokenModelName,
  RefreshTokenSchema,
} from '../models/refresh-token.model';
import { PostModelName, PostSchema } from '../models/post.model';
import { FollowModelName, FollowSchema } from '../models/follow.model';
import { CommentModelName, CommentSchema } from '../models/comment.model';
import { JwtStrategy } from '../infra/auth/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModelName, schema: UserSchema },
      { name: RefreshTokenModelName, schema: RefreshTokenSchema },
      { name: PostModelName, schema: PostSchema },
      { name: FollowModelName, schema: FollowSchema },
      { name: CommentModelName, schema: CommentSchema },
    ]),
  ],
  controllers: [
    HealthController,
    AuthController,
    MeController,
    UsersController,
    PostsController,
    CommentsController,
  ],
  providers: [
    HealthService,
    UsersService,
    AuthService,
    PostsService,
    FollowsService,
    CommentsService,
    JwtStrategy,
  ],
})
export class ApiV1Module {}
