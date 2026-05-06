"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashtagEventSchema = exports.HashtagEvent = exports.HashtagEventModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.HashtagEventModelName = 'HashtagEvent';
let HashtagEvent = class HashtagEvent {
    userId;
    sessionId;
    tag;
    action;
};
exports.HashtagEvent = HashtagEvent;
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], HashtagEvent.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], HashtagEvent.prototype, "sessionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], HashtagEvent.prototype, "tag", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, enum: ['view'], index: true }),
    __metadata("design:type", String)
], HashtagEvent.prototype, "action", void 0);
exports.HashtagEvent = HashtagEvent = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], HashtagEvent);
exports.HashtagEventSchema = mongoose_1.SchemaFactory.createForClass(HashtagEvent);
exports.HashtagEventSchema.index({ createdAt: -1, action: 1 });
exports.HashtagEventSchema.index({ tag: 1, createdAt: -1 });
exports.HashtagEventSchema.index({ userId: 1, createdAt: -1 });
//# sourceMappingURL=hashtag-event.model.js.map