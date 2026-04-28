import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { CreateOrderDto } from '../dto/shop/orders/create-order.dto';
import { QueryOrdersDto } from '../dto/shop/orders/query-orders.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
