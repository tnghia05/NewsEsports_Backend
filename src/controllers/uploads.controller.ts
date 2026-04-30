import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import type { JwtUser } from '../types/auth';
import { R2Service } from '../infra/r2/r2.service';
import { R2PresignDto } from '../dto/uploads/r2-presign.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly r2: R2Service) {}

  @Post('r2/presign')
  @UseGuards(JwtAuthGuard)
  presign(@CurrentUser() user: JwtUser, @Body() dto: R2PresignDto) {
    return this.r2.presignPutObject({
      fileName: dto.fileName,
      contentType: dto.contentType,
      folder: dto.folder ?? 'misc',
      userId: user.id,
    });
  }
}

