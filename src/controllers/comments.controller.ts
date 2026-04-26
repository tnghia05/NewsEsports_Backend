import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
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
  private readonly logger = new Logger(CommentsController.name);

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
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    const ua = (req.headers['user-agent'] as string | undefined) ?? 'n/a';
    const referer = (req.headers['referer'] as string | undefined) ?? 'n/a';
    this.logger.log(
      `createForPost user=${user.id} postId=${postId} ip=${ip} ua=${ua.slice(0, 80)} referer=${referer} contentLen=${(body?.content ?? '').length} contentPreview=${JSON.stringify((body?.content ?? '').slice(0, 60))}`,
    );
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

