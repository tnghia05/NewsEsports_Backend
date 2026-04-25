import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from '../controllers/health.controller';
import { AuthController } from '../controllers/auth.controller';
import { MeController } from '../controllers/me.controller';
import { UsersController } from '../controllers/users.controller';
import { PostsController } from '../controllers/posts.controller';
import { CommentsController } from '../controllers/comments.controller';
import { NotificationsController } from '../controllers/notifications.controller';
import { SearchController } from '../controllers/search.controller';
import { HashtagsController } from '../controllers/hashtags.controller';
import { NewsController } from '../controllers/news.controller';
import { RssSourcesController } from '../controllers/rss-sources.controller';
import { HealthService } from '../services/health.service';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { PostsService } from '../services/posts.service';
import { FollowsService } from '../services/follows.service';
import { CommentsService } from '../services/comments.service';
import { PostLikesService } from '../services/post-likes.service';
import { PostSavesService } from '../services/post-saves.service';
import { CommentLikesService } from '../services/comment-likes.service';
import { NotificationsService } from '../services/notifications.service';
import { SearchService } from '../services/search.service';
import { HashtagsService } from '../services/hashtags.service';
import { CommentModerationWorkerService } from '../services/comment-moderation-worker.service';
import { NewsService } from '../services/news.service';
import { NewsImportWorkerService } from '../services/news-import-worker.service';
import { RssSourcesService } from '../services/rss-sources.service';
import { UserModelName, UserSchema } from '../models/user.model';
import {
  RefreshTokenModelName,
  RefreshTokenSchema,
} from '../models/refresh-token.model';
import { PostModelName, PostSchema } from '../models/post.model';
import { FollowModelName, FollowSchema } from '../models/follow.model';
import { CommentModelName, CommentSchema } from '../models/comment.model';
import { PostLikeModelName, PostLikeSchema } from '../models/post-like.model';
import { PostSaveModelName, PostSaveSchema } from '../models/post-save.model';
import { CommentLikeModelName, CommentLikeSchema } from '../models/comment-like.model';
import { NotificationModelName, NotificationSchema } from '../models/notification.model';
import { CommentModerationJobModelName, CommentModerationJobSchema } from '../models/comment-moderation-job.model';
import { NewsModelName, NewsSchema } from '../models/news.model';
import { RssSourceModelName, RssSourceSchema } from '../models/rss-source.model';
import { JwtStrategy } from '../infra/auth/jwt.strategy';
import { AiService } from '../infra/ai/ai.service';
import { RssService } from '../infra/rss/rss.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModelName, schema: UserSchema },
      { name: RefreshTokenModelName, schema: RefreshTokenSchema },
      { name: PostModelName, schema: PostSchema },
      { name: FollowModelName, schema: FollowSchema },
      { name: CommentModelName, schema: CommentSchema },
      { name: PostLikeModelName, schema: PostLikeSchema },
      { name: PostSaveModelName, schema: PostSaveSchema },
      { name: CommentLikeModelName, schema: CommentLikeSchema },
      { name: NotificationModelName, schema: NotificationSchema },
      { name: CommentModerationJobModelName, schema: CommentModerationJobSchema },
      { name: NewsModelName, schema: NewsSchema },
      { name: RssSourceModelName, schema: RssSourceSchema },
    ]),
  ],
  controllers: [
    HealthController,
    AuthController,
    MeController,
    UsersController,
    PostsController,
    CommentsController,
    NewsController,
    RssSourcesController,
    HashtagsController,
    SearchController,
    NotificationsController,
  ],
  providers: [
    HealthService,
    UsersService,
    AuthService,
    PostsService,
    FollowsService,
    CommentsService,
    PostLikesService,
    PostSavesService,
    CommentLikesService,
    HashtagsService,
    SearchService,
    NotificationsService,
    NewsService,
    RssSourcesService,
    RssService,
    NewsImportWorkerService,
    AiService,
    CommentModerationWorkerService,
    JwtStrategy,
  ],
})
export class ApiV1Module {}
