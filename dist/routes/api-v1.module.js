"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiV1Module = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const health_controller_1 = require("../controllers/health.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const me_controller_1 = require("../controllers/me.controller");
const users_controller_1 = require("../controllers/users.controller");
const posts_controller_1 = require("../controllers/posts.controller");
const comments_controller_1 = require("../controllers/comments.controller");
const notifications_controller_1 = require("../controllers/notifications.controller");
const search_controller_1 = require("../controllers/search.controller");
const hashtags_controller_1 = require("../controllers/hashtags.controller");
const news_controller_1 = require("../controllers/news.controller");
const rss_sources_controller_1 = require("../controllers/rss-sources.controller");
const crawl_sources_controller_1 = require("../controllers/crawl-sources.controller");
const products_controller_1 = require("../controllers/products.controller");
const orders_controller_1 = require("../controllers/orders.controller");
const payments_controller_1 = require("../controllers/payments.controller");
const uploads_controller_1 = require("../controllers/uploads.controller");
const health_service_1 = require("../services/health.service");
const users_service_1 = require("../services/users.service");
const auth_service_1 = require("../services/auth.service");
const posts_service_1 = require("../services/posts.service");
const follows_service_1 = require("../services/follows.service");
const comments_service_1 = require("../services/comments.service");
const post_likes_service_1 = require("../services/post-likes.service");
const post_saves_service_1 = require("../services/post-saves.service");
const comment_likes_service_1 = require("../services/comment-likes.service");
const notifications_service_1 = require("../services/notifications.service");
const search_service_1 = require("../services/search.service");
const hashtags_service_1 = require("../services/hashtags.service");
const comment_moderation_worker_service_1 = require("../services/comment-moderation-worker.service");
const news_service_1 = require("../services/news.service");
const news_import_worker_service_1 = require("../services/news-import-worker.service");
const rss_sources_service_1 = require("../services/rss-sources.service");
const crawl_sources_service_1 = require("../services/crawl-sources.service");
const news_crawl_worker_service_1 = require("../services/news-crawl-worker.service");
const products_service_1 = require("../services/products.service");
const orders_service_1 = require("../services/orders.service");
const payments_service_1 = require("../services/payments.service");
const order_reservations_service_1 = require("../services/order-reservations.service");
const order_reservations_worker_service_1 = require("../services/order-reservations-worker.service");
const user_model_1 = require("../models/user.model");
const refresh_token_model_1 = require("../models/refresh-token.model");
const post_model_1 = require("../models/post.model");
const follow_model_1 = require("../models/follow.model");
const comment_model_1 = require("../models/comment.model");
const post_like_model_1 = require("../models/post-like.model");
const post_save_model_1 = require("../models/post-save.model");
const comment_like_model_1 = require("../models/comment-like.model");
const notification_model_1 = require("../models/notification.model");
const comment_moderation_job_model_1 = require("../models/comment-moderation-job.model");
const news_model_1 = require("../models/news.model");
const rss_source_model_1 = require("../models/rss-source.model");
const crawl_source_model_1 = require("../models/crawl-source.model");
const search_event_model_1 = require("../models/search-event.model");
const hot_keyword_model_1 = require("../models/hot-keyword.model");
const hashtag_event_model_1 = require("../models/hashtag-event.model");
const hot_topic_model_1 = require("../models/hot-topic.model");
const product_model_1 = require("../models/product.model");
const product_variant_model_1 = require("../models/product-variant.model");
const order_model_1 = require("../models/order.model");
const payment_model_1 = require("../models/payment.model");
const order_counter_model_1 = require("../models/order-counter.model");
const jwt_strategy_1 = require("../infra/auth/jwt.strategy");
const ai_service_1 = require("../infra/ai/ai.service");
const rss_service_1 = require("../infra/rss/rss.service");
const hot_keywords_worker_service_1 = require("../services/hot-keywords-worker.service");
const hot_topics_worker_service_1 = require("../services/hot-topics-worker.service");
const r2_service_1 = require("../infra/r2/r2.service");
let ApiV1Module = class ApiV1Module {
};
exports.ApiV1Module = ApiV1Module;
exports.ApiV1Module = ApiV1Module = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_model_1.UserModelName, schema: user_model_1.UserSchema },
                { name: refresh_token_model_1.RefreshTokenModelName, schema: refresh_token_model_1.RefreshTokenSchema },
                { name: post_model_1.PostModelName, schema: post_model_1.PostSchema },
                { name: follow_model_1.FollowModelName, schema: follow_model_1.FollowSchema },
                { name: comment_model_1.CommentModelName, schema: comment_model_1.CommentSchema },
                { name: post_like_model_1.PostLikeModelName, schema: post_like_model_1.PostLikeSchema },
                { name: post_save_model_1.PostSaveModelName, schema: post_save_model_1.PostSaveSchema },
                { name: comment_like_model_1.CommentLikeModelName, schema: comment_like_model_1.CommentLikeSchema },
                { name: notification_model_1.NotificationModelName, schema: notification_model_1.NotificationSchema },
                {
                    name: comment_moderation_job_model_1.CommentModerationJobModelName,
                    schema: comment_moderation_job_model_1.CommentModerationJobSchema,
                },
                { name: news_model_1.NewsModelName, schema: news_model_1.NewsSchema },
                { name: rss_source_model_1.RssSourceModelName, schema: rss_source_model_1.RssSourceSchema },
                { name: crawl_source_model_1.CrawlSourceModelName, schema: crawl_source_model_1.CrawlSourceSchema },
                { name: search_event_model_1.SearchEventModelName, schema: search_event_model_1.SearchEventSchema },
                { name: hot_keyword_model_1.HotKeywordModelName, schema: hot_keyword_model_1.HotKeywordSchema },
                { name: hashtag_event_model_1.HashtagEventModelName, schema: hashtag_event_model_1.HashtagEventSchema },
                { name: hot_topic_model_1.HotTopicModelName, schema: hot_topic_model_1.HotTopicSchema },
                { name: product_model_1.ProductModelName, schema: product_model_1.ProductSchema },
                { name: product_variant_model_1.ProductVariantModelName, schema: product_variant_model_1.ProductVariantSchema },
                { name: order_model_1.OrderModelName, schema: order_model_1.OrderSchema },
                { name: payment_model_1.PaymentModelName, schema: payment_model_1.PaymentSchema },
                { name: order_counter_model_1.OrderCounterModelName, schema: order_counter_model_1.OrderCounterSchema },
            ]),
        ],
        controllers: [
            health_controller_1.HealthController,
            auth_controller_1.AuthController,
            me_controller_1.MeController,
            users_controller_1.UsersController,
            posts_controller_1.PostsController,
            comments_controller_1.CommentsController,
            news_controller_1.NewsController,
            rss_sources_controller_1.RssSourcesController,
            crawl_sources_controller_1.CrawlSourcesController,
            hashtags_controller_1.HashtagsController,
            search_controller_1.SearchController,
            notifications_controller_1.NotificationsController,
            products_controller_1.ProductsController,
            orders_controller_1.OrdersController,
            payments_controller_1.PaymentsController,
            uploads_controller_1.UploadsController,
        ],
        providers: [
            health_service_1.HealthService,
            users_service_1.UsersService,
            auth_service_1.AuthService,
            posts_service_1.PostsService,
            follows_service_1.FollowsService,
            comments_service_1.CommentsService,
            post_likes_service_1.PostLikesService,
            post_saves_service_1.PostSavesService,
            comment_likes_service_1.CommentLikesService,
            hashtags_service_1.HashtagsService,
            search_service_1.SearchService,
            notifications_service_1.NotificationsService,
            news_service_1.NewsService,
            rss_sources_service_1.RssSourcesService,
            rss_service_1.RssService,
            news_import_worker_service_1.NewsImportWorkerService,
            crawl_sources_service_1.CrawlSourcesService,
            news_crawl_worker_service_1.NewsCrawlWorkerService,
            hot_keywords_worker_service_1.HotKeywordsWorkerService,
            hot_topics_worker_service_1.HotTopicsWorkerService,
            products_service_1.ProductsService,
            orders_service_1.OrdersService,
            payments_service_1.PaymentsService,
            order_reservations_service_1.OrderReservationsService,
            order_reservations_worker_service_1.OrderReservationsWorkerService,
            ai_service_1.AiService,
            comment_moderation_worker_service_1.CommentModerationWorkerService,
            jwt_strategy_1.JwtStrategy,
            r2_service_1.R2Service,
        ],
    })
], ApiV1Module);
//# sourceMappingURL=api-v1.module.js.map