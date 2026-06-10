import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { CreateProductDto } from '../dto/shop/products/create-product.dto';
import { UpdateProductDto } from '../dto/shop/products/update-product.dto';
import { QueryProductsDto } from '../dto/shop/products/query-products.dto';
import { CreateProductVariantDto } from '../dto/shop/products/variants/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/shop/products/variants/update-product-variant.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public
  @Get()
  listPublic(@Query() query: QueryProductsDto) {
    return this.productsService.listPublic(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Get(':id/variants')
  listVariantsPublic(@Param('id') productId: string) {
    return this.productsService.listVariantsPublic(productId);
  }

  // Admin
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin(@CurrentUser() admin: JwtUser, @Query() query: QueryProductsDto) {
    return this.productsService.listAdmin(admin, query);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@CurrentUser() admin: JwtUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(admin, dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @CurrentUser() admin: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(admin, id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@CurrentUser() admin: JwtUser, @Param('id') id: string) {
    return this.productsService.remove(admin, id);
  }

  @Get('admin/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listVariantsAdmin(
    @CurrentUser() admin: JwtUser,
    @Param('id') productId: string,
  ) {
    return this.productsService.listVariantsAdmin(admin, productId);
  }

  @Post('admin/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createVariant(
    @CurrentUser() admin: JwtUser,
    @Param('id') productId: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(admin, productId, dto);
  }

  @Patch('admin/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateVariant(
    @CurrentUser() admin: JwtUser,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(admin, variantId, dto);
  }

  @Delete('admin/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  removeVariant(
    @CurrentUser() admin: JwtUser,
    @Param('variantId') variantId: string,
  ) {
    return this.productsService.removeVariant(admin, variantId);
  }
}
