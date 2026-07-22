import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

import { CreateNewsApiConfigDto } from './dto/create-news-api-config.dto';
import { UpdateNewsApiConfigDto } from './dto/update-news-api-config.dto';
import { AiConfigService } from './ai-config.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ValidateNewsDto {
  @IsString()
  @IsNotEmpty()
  keyword: string;

  @IsOptional()
  @IsString()
  category: string;
}

@Controller('ai-config')
export class AiConfigController {
  constructor(private readonly service: AiConfigService) {}
  @Post('news-api-configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createNewsApiConfig(
    @Body() dto: CreateNewsApiConfigDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.createNewsApiConfig(req.user.id, dto);
  }

  @Post('validate-news')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  validateNews(@Body() dto: ValidateNewsDto) {
    return this.service.validateNews(dto.keyword, dto.category);
  }

  @Patch('news-api-configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  updateNewsApiConfig(
    @Param('id') id: string,
    @Body() dto: UpdateNewsApiConfigDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.updateNewsApiConfig(Number(id), req.user.id, dto);
  }

  @Get('news-api-configs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  getNewsApiConfigs(@Req() req: AuthRequest) {
    return this.service.getNewsApiConfigs(req.user.id);
  }

  @Delete('news-api-configs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  deleteNewsApiConfig(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.service.deleteNewsApiConfig(Number(id), req.user.id);
  }
}
