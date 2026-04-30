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
exports.ProductVariantSchema = exports.ProductVariant = exports.VariantOption = exports.ProductVariantModelName = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const product_model_1 = require("./product.model");
exports.ProductVariantModelName = 'ProductVariant';
class VariantOption {
    k;
    v;
}
exports.VariantOption = VariantOption;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], VariantOption.prototype, "k", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], VariantOption.prototype, "v", void 0);
let ProductVariant = class ProductVariant {
    productId;
    title;
    skuCode;
    options;
    price;
    stock;
    reserved;
    status;
};
exports.ProductVariant = ProductVariant;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: product_model_1.ProductModelName, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ProductVariant.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, trim: true }),
    __metadata("design:type", String)
], ProductVariant.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true, index: true, trim: true }),
    __metadata("design:type", String)
], ProductVariant.prototype, "skuCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [VariantOption], default: [] }),
    __metadata("design:type", Array)
], ProductVariant.prototype, "options", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0, index: true }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0, index: true }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "stock", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0, default: 0, index: true }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "reserved", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true,
    }),
    __metadata("design:type", String)
], ProductVariant.prototype, "status", void 0);
exports.ProductVariant = ProductVariant = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ProductVariant);
exports.ProductVariantSchema = mongoose_1.SchemaFactory.createForClass(ProductVariant);
exports.ProductVariantSchema.index({ productId: 1, status: 1, createdAt: -1 });
exports.ProductVariantSchema.index({ productId: 1, skuCode: 1 });
//# sourceMappingURL=product-variant.model.js.map