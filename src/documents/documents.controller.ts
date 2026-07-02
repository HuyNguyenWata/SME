import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { parseId } from '../common/utils/id.util';
import { DocumentsService } from './documents.service';
import { CreateCrawlDocDto } from './dto/create-crawl-doc.dto';
import { CreateRawDocDto } from './dto/create-raw-doc.dto';

@ApiTags('Documents')
@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get('raw-docs')
  rawDocs(@Query() query: PaginationQueryDto) {
    return this.documents.rawDocs(query);
  }

  @Post('raw-docs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create raw source document' })
  createRawDoc(@Body() dto: CreateRawDocDto) {
    return this.documents.createRawDoc(dto);
  }

  @Get('raw-docs/:id')
  rawDoc(@Param('id') id: string) {
    return this.documents.rawDoc(parseId(id));
  }

  @Delete('raw-docs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  removeRawDoc(@Param('id') id: string) {
    return this.documents.removeRawDoc(parseId(id));
  }

  @Get('crawl-docs')
  crawls(@Query() query: PaginationQueryDto) {
    return this.documents.crawls(query);
  }

  @Post('crawl-docs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createCrawl(@Body() dto: CreateCrawlDocDto) {
    return this.documents.createCrawl(dto);
  }
}
