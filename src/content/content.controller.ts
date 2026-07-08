import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
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

@ApiTags('Content')
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('generated-content')
  generated(@Query() query: PaginationQueryDto) {
    return this.content.generated(query);
  }

  @Get('social-posts')
  socialPosts(@Query() query: SocialPostQueryDto) {
    return this.content.socialPosts(query);
  }

  @Post('social-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createSocialPost(@Body() dto: CreateSocialPostDto) {
    return this.content.createSocialPost(dto);
  }

  @Post('generated-content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createGeneratedContent(@Body() dto: CreateGeneratedContentDto) {
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
  ) {
    return this.content.calendar(year, month);
  }
}
