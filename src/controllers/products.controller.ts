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
}
