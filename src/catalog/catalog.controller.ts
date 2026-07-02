import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { parseId } from '../common/utils/id.util';
import { CatalogService } from './catalog.service';
import { CategoryDto } from './dto/category.dto';

@ApiTags('Catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List categories' })
  categories() {
    return this.catalog.categories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createCategory(@Body() dto: CategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  updateCategory(@Param('id') id: string, @Body() dto: CategoryDto) {
    return this.catalog.updateCategory(parseId(id), dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  removeCategory(@Param('id') id: string) {
    return this.catalog.removeCategory(parseId(id));
  }

  @Get('rss-sources')
  @ApiOperation({ summary: 'List RSS sources' })
  rssSources() {
    return this.catalog.rssSources();
  }
}
