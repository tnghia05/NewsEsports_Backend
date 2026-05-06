import type { JwtUser } from '../types/auth';
import { QueryNotificationsDto } from '../dto/notifications/query-notifications.dto';
import { NotificationsService } from '../services/notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    list(user: JwtUser, query: QueryNotificationsDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../models/notification.model").Notification, {}, import("mongoose").DefaultSchemaOptions> & import("../models/notification.model").Notification & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("../models/notification.model").Notification, {}, import("mongoose").DefaultSchemaOptions> & import("../models/notification.model").Notification & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
    read(user: JwtUser, id: string): Promise<{
        ok: boolean;
    }>;
    readAll(user: JwtUser): Promise<{
        ok: boolean;
    }>;
}
