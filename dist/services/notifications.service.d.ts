import type { Model } from 'mongoose';
import { type NotificationDocument, type NotificationType } from '../models/notification.model';
export declare class NotificationsService {
    private readonly notificationModel;
    constructor(notificationModel: Model<NotificationDocument>);
    create(input: {
        userId: string;
        actorId?: string;
        type: NotificationType;
        postId?: string;
        commentId?: string;
        message?: string;
    }): Promise<{
        ok: boolean;
    }>;
    list(userId: string, opts: {
        page: number;
        limit: number;
    }): Promise<{
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
    markRead(userId: string, notificationId: string): Promise<{
        ok: boolean;
    }>;
    markAllRead(userId: string): Promise<{
        ok: boolean;
    }>;
}
