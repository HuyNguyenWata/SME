import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import {
  PaginationQueryDto,
  SocialPostQueryDto,
} from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContentService } from './content.service';
import { CreateSocialPostDto } from './dto/create-social-post.dto';
import {
  CreateGeneratedContentDto,
  CreateSocialCalendarDto,
} from './dto/create-generated-content.dto';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

@ApiTags('Content')
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('generated-content')
  @UseGuards(OptionalJwtAuthGuard)
  generated(
    @Query() query: PaginationQueryDto,
    @Req() req: import('express').Request,
    @User('id') currentUserId?: number,
  ) {
    const storeIdHeader = req.headers['x-store-id'];
    const targetStoreId =
      currentUserId ||
      (storeIdHeader ? parseInt(storeIdHeader as string, 10) : undefined);
    if (!targetStoreId) {
      throw new UnauthorizedException('Authentication or Store ID required');
    }
    return this.content.generated(query, targetStoreId);
  }

  @Get('social-posts')
  @UseGuards(OptionalJwtAuthGuard)
  mySocialPosts(
    @Query() query: SocialPostQueryDto,
    @Req() req: import('express').Request,
    @User('id') currentUserId?: number,
  ) {
    const storeIdHeader = req.headers['x-store-id'];
    const targetStoreId =
      currentUserId ||
      (storeIdHeader ? parseInt(storeIdHeader as string, 10) : undefined);
    if (!targetStoreId) {
      throw new UnauthorizedException('Authentication or Store ID required');
    }
    return this.content.mySocialPosts(query, targetStoreId);
  }

  @Get('ai-social-posts')
  @UseGuards(OptionalJwtAuthGuard)
  aiSocialPosts(
    @Query() query: SocialPostQueryDto,
    @Req() req: import('express').Request,
    @User('id') currentUserId?: number,
  ) {
    const storeIdHeader = req.headers['x-store-id'];
    const targetStoreId =
      currentUserId ||
      (storeIdHeader ? parseInt(storeIdHeader as string, 10) : undefined);
    if (!targetStoreId) {
      throw new UnauthorizedException('Authentication or Store ID required');
    }
    return this.content.aiSocialPosts(query, targetStoreId);
  }

  @Get('all-social-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  allMySocialPosts(@User('id') userId: number) {
    return this.content.allMySocialPosts(userId);
  }

  @Get('all-ai-social-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  allAiSocialPosts(@User('id') userId: number) {
    return this.content.allAiSocialPosts(userId);
  }

  @Post('social-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createSocialPost(@Body() dto: CreateSocialPostDto) {
    return this.content.createSocialPost(dto);
  }

  @Post('social-posts/:id/sync-engagement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  syncSocialEngagement(@Param('id', ParseIntPipe) id: number) {
    return this.content.syncSocialEngagement(id);
  }

  @Post('generated-content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createGeneratedContent(
    @Body() dto: CreateGeneratedContentDto,
    @User('id') userId: number,
  ) {
    dto.userId = userId;
    return this.content.createGeneratedContent(dto);
  }

  @Post('social-calendars')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createSocialCalendar(@Body() dto: CreateSocialCalendarDto) {
    return this.content.createSocialCalendar(dto);
  }

  @Get('social-platforms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async findAllSocialPlatform() {
    return this.content.findAllSocialPlatform();
  }

  @Get('calendar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async calendar(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @User('id') userId: number,
  ) {
    return this.content.calendar(year, month, userId);
  }

  @Get('news-categories')
  getNewsCategories() {
    return this.content.getNewsCategories();
  }
}
