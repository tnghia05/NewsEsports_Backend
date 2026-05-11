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
import { CrawlSourcesController } from '../controllers/crawl-sources.controller';
import { ProductsController } from '../controllers/products.controller';
import { OrdersController } from '../controllers/orders.controller';
import { PaymentsController } from '../controllers/payments.controller';
import { UploadsController } from '../controllers/uploads.controller';
import { MatchesController } from '../controllers/matches.controller';
import { LoLEsportsController } from '../controllers/lol-esports.controller';
import { PandaScoreController } from '../controllers/pandascore.controller';
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
import { CrawlSourcesService } from '../services/crawl-sources.service';
import { NewsCrawlWorkerService } from '../services/news-crawl-worker.service';
import { ProductsService } from '../services/products.service';
import { OrdersService } from '../services/orders.service';
import { PaymentsService } from '../services/payments.service';
import { OrderReservationsService } from '../services/order-reservations.service';
import { OrderReservationsWorkerService } from '../services/order-reservations-worker.service';
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
import {
  CommentLikeModelName,
  CommentLikeSchema,
} from '../models/comment-like.model';
import {
  NotificationModelName,
  NotificationSchema,
} from '../models/notification.model';
import {
  CommentModerationJobModelName,
  CommentModerationJobSchema,
} from '../models/comment-moderation-job.model';
import { NewsModelName, NewsSchema } from '../models/news.model';
import {
  RssSourceModelName,
  RssSourceSchema,
} from '../models/rss-source.model';
import {
  CrawlSourceModelName,
  CrawlSourceSchema,
} from '../models/crawl-source.model';
import {
  SearchEventModelName,
  SearchEventSchema,
} from '../models/search-event.model';
import {
  HotKeywordModelName,
  HotKeywordSchema,
} from '../models/hot-keyword.model';
import {
  HashtagEventModelName,
  HashtagEventSchema,
} from '../models/hashtag-event.model';
import { HotTopicModelName, HotTopicSchema } from '../models/hot-topic.model';
import { ProductModelName, ProductSchema } from '../models/product.model';
import { ProductVariantModelName, ProductVariantSchema } from '../models/product-variant.model';
import { OrderModelName, OrderSchema } from '../models/order.model';
import { PaymentModelName, PaymentSchema } from '../models/payment.model';
import {
  OrderCounterModelName,
  OrderCounterSchema,
} from '../models/order-counter.model';
import { JwtStrategy } from '../infra/auth/jwt.strategy';
import { AiService } from '../infra/ai/ai.service';
import { RssService } from '../infra/rss/rss.service';
import { HotKeywordsWorkerService } from '../services/hot-keywords-worker.service';
import { HotTopicsWorkerService } from '../services/hot-topics-worker.service';
import { R2Service } from '../infra/r2/r2.service';
import { MatchesService } from '../services/matches.service';
import { MatchSyncWorkerService } from '../services/match-sync-worker.service';
import { PandaScoreService } from '../infra/pandascore/pandascore.service';
import { LoLEsportsService } from '../services/lol-esports.service';
import { GridController } from '../controllers/grid.controller';
import { KalstropController } from '../controllers/kalstrop.controller';
import { AdminController } from '../controllers/admin.controller';
import { GridService } from '../services/grid.service';
import { KalstropService } from '../services/kalstrop.service';
import { AiStatsService } from '../services/ai-stats.service';
import { MatchModelName, MatchSchema } from '../models/match.model';
import {
  AdminAlertModelName,
  AdminAlertSchema,
} from '../models/admin-alert.model';
import {
  EntityTrendModelName,
  EntityTrendSchema,
} from '../models/entity-trend.model';

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
      {
        name: CommentModerationJobModelName,
        schema: CommentModerationJobSchema,
      },
      { name: NewsModelName, schema: NewsSchema },
      { name: RssSourceModelName, schema: RssSourceSchema },
      { name: CrawlSourceModelName, schema: CrawlSourceSchema },
      { name: SearchEventModelName, schema: SearchEventSchema },
      { name: HotKeywordModelName, schema: HotKeywordSchema },
      { name: HashtagEventModelName, schema: HashtagEventSchema },
      { name: HotTopicModelName, schema: HotTopicSchema },
      { name: ProductModelName, schema: ProductSchema },
      { name: ProductVariantModelName, schema: ProductVariantSchema },
      { name: OrderModelName, schema: OrderSchema },
      { name: PaymentModelName, schema: PaymentSchema },
      { name: OrderCounterModelName, schema: OrderCounterSchema },
      { name: MatchModelName, schema: MatchSchema },
      { name: AdminAlertModelName, schema: AdminAlertSchema },
      { name: EntityTrendModelName, schema: EntityTrendSchema },
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
    CrawlSourcesController,
    HashtagsController,
    SearchController,
    NotificationsController,
    ProductsController,
    OrdersController,
    PaymentsController,
    UploadsController,
    MatchesController,
    PandaScoreController,
    LoLEsportsController,
    GridController,
    KalstropController,
    AdminController,
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
    CrawlSourcesService,
    NewsCrawlWorkerService,
    HotKeywordsWorkerService,
    HotTopicsWorkerService,
    ProductsService,
    OrdersService,
    PaymentsService,
    OrderReservationsService,
    OrderReservationsWorkerService,
    AiService,
    CommentModerationWorkerService,
    MatchesService,
    MatchSyncWorkerService,
    PandaScoreService,
    LoLEsportsService,
    GridService,
    KalstropService,
    AiStatsService,
    JwtStrategy,
    R2Service,
  ],
})
export class ApiV1Module {}
