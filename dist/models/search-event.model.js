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
exports.SearchEventSchema = exports.SearchEvent = exports.SearchEventModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.SearchEventModelName = 'SearchEvent';
let SearchEvent = class SearchEvent {
    userId;
    sessionId;
    q;
    action;
    targetId;
};
exports.SearchEvent = SearchEvent;
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], SearchEvent.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true }),
    __metadata("design:type", String)
], SearchEvent.prototype, "sessionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], SearchEvent.prototype, "q", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        enum: ['search', 'click'],
        index: true,
    }),
    __metadata("design:type", String)
], SearchEvent.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], SearchEvent.prototype, "targetId", void 0);
exports.SearchEvent = SearchEvent = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], SearchEvent);
exports.SearchEventSchema = mongoose_1.SchemaFactory.createForClass(SearchEvent);
exports.SearchEventSchema.index({ createdAt: -1, action: 1 });
exports.SearchEventSchema.index({ q: 1, createdAt: -1 });
exports.SearchEventSchema.index({ userId: 1, createdAt: -1 });
//# sourceMappingURL=search-event.model.js.map