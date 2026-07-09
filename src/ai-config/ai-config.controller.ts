import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateNewsApiConfigDto } from './dto/create-news-api-config.dto';
import { UpdateNewsApiConfigDto } from './dto/update-news-api-config.dto';
import { AiConfigService } from './ai-config.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('ai-config')
export class AiConfigController {
  constructor(private readonly service: AiConfigService) {}
  @Post('news-api-configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createNewsApiConfig(@Body() dto: CreateNewsApiConfigDto, @Req() req) {
    return this.service.createNewsApiConfig(req.user.id, dto);
  }

  @Patch('news-api-configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  updateNewsApiConfig(
    @Param('id') id: string,
    @Body() dto: UpdateNewsApiConfigDto,
    @Req() req,
  ) {
    return this.service.updateNewsApiConfig(Number(id), req.user.id, dto);
  }

  @Get('news-api-configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  getNewsApiConfigs(@Req() req) {
    return this.service.getNewsApiConfigs(req.user.id);
  }
}
