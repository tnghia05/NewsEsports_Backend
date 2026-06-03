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
import { ConfigService } from '@nestjs/config';
import { PostsService } from '../services/posts.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { CreatePostDto } from '../dto/posts/create-post.dto';
import { UpdatePostDto } from '../dto/posts/update-post.dto';
import { QueryPostsDto } from '../dto/posts/query-posts.dto';
import { PostLikesService } from '../services/post-likes.service';
import { PostSavesService } from '../services/post-saves.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postLikesService: PostLikesService,
    private readonly postSavesService: PostSavesService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @CurrentUser() user: JwtUser | undefined,
    @Query() query: QueryPostsDto,
  ) {
    return this.postsService.list(user, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getById(@CurrentUser() user: JwtUser | undefined, @Param('id') id: string) {
    return this.postsService.getById(user, id);
  }

  @Get(':id/comment-digest')
  getCommentDigest(@Param('id') id: string) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY', { infer: true }) ?? null;
    return this.postsService.getCommentDigest(id, apiKey);
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

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.postLikesService.toggleLike(user, id);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  toggleSave(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.postSavesService.toggleSave(user, id);
  }

  @Get(':id/likes')
  getLikes(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.listLikes(id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post(':id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  pin(@Param('id') id: string) {
    return this.postsService.pin(id);
  }

  @Post(':id/unpin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  unpin(@Param('id') id: string) {
    return this.postsService.unpin(id);
  }
}
