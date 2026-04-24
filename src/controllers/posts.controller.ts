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
import { PostsService } from '../services/posts.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { CreatePostDto } from '../dto/posts/create-post.dto';
import { UpdatePostDto } from '../dto/posts/update-post.dto';
import { QueryPostsDto } from '../dto/posts/query-posts.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@CurrentUser() user: JwtUser | undefined, @Query() query: QueryPostsDto) {
    return this.postsService.list(user, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getById(@CurrentUser() user: JwtUser | undefined, @Param('id') id: string) {
    return this.postsService.getById(user, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: JwtUser, @Body() body: CreatePostDto) {
    return this.postsService.create(user, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.update(user, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.postsService.remove(user, id);
  }
}
