import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
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
import { CancelOrderDto } from '../dto/shop/orders/cancel-order.dto';
import { AdminCancelOrderDto } from '../dto/shop/orders/admin-cancel-order.dto';
import { AdminOrderNotesDto } from '../dto/shop/orders/admin-order-notes.dto';

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

  @Get('admin/export.csv')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async exportAdminCsv(
    @CurrentUser() admin: JwtUser,
    @Query() query: QueryOrdersDto,
  ) {
    const buf = await this.ordersService.exportAdminCsv(admin, query);
    return new StreamableFile(buf, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="orders.csv"`,
    });
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

  @Patch('admin/:orderRef/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminCancel(
    @CurrentUser() admin: JwtUser,
    @Param('orderRef') orderRef: string,
    @Body() dto: AdminCancelOrderDto,
  ) {
    return this.ordersService.adminCancel(admin, orderRef, dto);
  }

  @Patch('admin/:orderRef/notes')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminNotes(
    @CurrentUser() admin: JwtUser,
    @Param('orderRef') orderRef: string,
    @Body() dto: AdminOrderNotesDto,
  ) {
    return this.ordersService.adminSetInternalNotes(admin, orderRef, dto);
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

  @Patch(':id/cancel')
  cancelMine(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelMine(user, id, dto.reason);
  }
}
