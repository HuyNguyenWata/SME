import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { parseId } from '../common/utils/id.util';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';
import { FilesInterceptor } from '@nestjs/platform-express';

class DeleteProductsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids!: number[];
}

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  findAll(@Query() query: ProductQueryDto) {
    return this.products.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.products.findOne(parseId(id));
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get product analytics' })
  @ApiParam({ name: 'id', type: Number })
  getAnalytics(@Param('id') id: string, @Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 14;
    return this.products.getProductAnalytics(parseId(id), d);
  }

  @Post('bulk-get')
  @ApiOperation({ summary: 'Get products by multiple IDs (for AI Core)' })
  findByIds(
    @Body() dto: import('./dto/get-products-by-ids.dto').GetProductsByIdsDto,
  ) {
    return this.products.findByIds(dto.ids);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER') // Adjust roles as needed, or omit @Roles to just require login
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Create product' })
  create(
    @User('id') userId: number,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(userId, dto, images);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(parseId(id), dto, images);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiBody({ type: DeleteProductsDto })
  @ApiOperation({ summary: 'Delete products' })
  removeMany(@Body() dto: DeleteProductsDto) {
    return this.products.removeMany(dto.ids);
  }

  @Post(':id/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger AI Core sync for a product' })
  syncProduct(@Param('id') id: string) {
    return this.products.syncProduct(parseId(id));
  }

  @Post('webhook/ai-sync')
  @ApiOperation({ summary: 'Webhook to receive AI vector sync status' })
  async aiSyncWebhook(
    @Body() dto: import('./dto/ai-sync-webhook.dto').AiSyncWebhookDto,
  ) {
    return this.products.updateEmbeddingStatus(dto.productId, dto.status);
  }
}
