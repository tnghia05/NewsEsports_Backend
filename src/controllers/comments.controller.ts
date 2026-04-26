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
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { CommentsService } from '../services/comments.service';
import { CommentLikesService } from '../services/comment-likes.service';
import { QueryCommentsDto } from '../dto/comments/query-comments.dto';
import { CreateCommentDto } from '../dto/comments/create-comment.dto';
import { UpdateCommentDto } from '../dto/comments/update-comment.dto';

@Controller()
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentLikesService: CommentLikesService,
  ) {}

  @Get('posts/:postId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  listForPost(
    @CurrentUser() user: JwtUser | undefined,
    @Param('postId') postId: string,
    @Query() query: QueryCommentsDto,
  ) {
    return this.commentsService.listForPost(user, postId, query);
  }

  @Get('comments/:id/replies')
  @UseGuards(OptionalJwtAuthGuard)
  listReplies(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id') id: string,
    @Query() query: QueryCommentsDto,
  ) {
    return this.commentsService.listReplies(user, id, query);
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  createForPost(
    @CurrentUser() user: JwtUser,
    @Param('postId') postId: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.commentsService.createForPost(user, postId, body);
  }

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: UpdateCommentDto,
  ) {
    return this.commentsService.update(user, id, body);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.commentsService.remove(user, id);
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.commentLikesService.toggleLike(user, id);
  }
}

