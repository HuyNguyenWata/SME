import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContentService } from './content.service';
import { CreateSocialPostDto } from './dto/create-social-post.dto';

@ApiTags('Content')
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('generated-content')
  generated(@Query() query: PaginationQueryDto) {
    return this.content.generated(query);
  }

  @Get('social-posts')
  socialPosts(@Query() query: PaginationQueryDto) {
    return this.content.socialPosts(query);
  }

  @Post('social-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createSocialPost(@Body() dto: CreateSocialPostDto) {
    return this.content.createSocialPost(dto);
  }
}
