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
exports.OrderCounterSchema = exports.OrderCounter = exports.OrderCounterModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.OrderCounterModelName = 'OrderCounter';
let OrderCounter = class OrderCounter {
    key;
    seq;
};
exports.OrderCounter = OrderCounter;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true, index: true }),
    __metadata("design:type", String)
], OrderCounter.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, default: 0 }),
    __metadata("design:type", Number)
], OrderCounter.prototype, "seq", void 0);
exports.OrderCounter = OrderCounter = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], OrderCounter);
exports.OrderCounterSchema = mongoose_1.SchemaFactory.createForClass(OrderCounter);
//# sourceMappingURL=order-counter.model.js.map