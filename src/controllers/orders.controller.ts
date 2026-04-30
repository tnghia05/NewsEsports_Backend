import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { CreateOrderDto } from '../dto/shop/orders/create-order.dto';
import { QueryOrdersDto } from '../dto/shop/orders/query-orders.dto';
import { AdminUpdateOrderStatusDto } from '../dto/shop/orders/admin-update-order-status.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Admin
  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listAdmin(@CurrentUser() admin: JwtUser, @Query() query: QueryOrdersDto) {
    return this.ordersService.listAdmin(admin, query);
  }

  @Get('admin/:orderRef')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAdmin(@CurrentUser() admin: JwtUser, @Param('orderRef') orderRef: string) {
    return this.ordersService.getAdmin(admin, orderRef);
  }

  @Patch('admin/:orderRef/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(
    @CurrentUser() admin: JwtUser,
    @Param('orderRef') orderRef: string,
    @Body() dto: AdminUpdateOrderStatusDto,
  ) {
    return this.ordersService.adminUpdateStatus(admin, orderRef, dto);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user, dto);
  }

  @Get('me')
  listMine(@CurrentUser() user: JwtUser, @Query() query: QueryOrdersDto) {
    return this.ordersService.listMine(user, query);
  }

  @Get(':id')
  getMine(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ordersService.getMine(user, id);
  }
}
