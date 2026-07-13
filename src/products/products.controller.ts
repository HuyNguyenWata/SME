import { Readable } from 'stream';
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
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import type { AuthUser } from '../common/types/auth-user.type';
import { parseId } from '../common/utils/id.util';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductFromAiDto } from './dto/create-product-from-ai.dto';
import { ProductAlertQueryDto } from './dto/product-alert-query.dto';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

class DeleteProductsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids!: number[];
}

class GenerateContentStreamDto {
  @ApiProperty()
  @IsString()
  prompt!: string;

  @ApiProperty({
    type: [String],
    required: false,
    description:
      'Fields to generate. Empty/omitted = generate all. Valid: name, description, specifications, price, sku, images',
    example: ['description', 'specifications'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedFields?: string[];

  @ApiProperty({
    type: Object,
    required: false,
    description:
      'Existing product data for edit mode. Keys should match CreateProductDto schema.',
  })
  @IsOptional()
  existingContent?: Record<string, any>;

  @ApiProperty({
    type: String,
    required: false,
    description: "Operation mode: 'create' or 'edit'. Default is 'create'.",
    enum: ['create', 'edit'],
  })
  @IsOptional()
  @IsString()
  mode?: 'create' | 'edit';
}

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List products' })
  findAll(
    @Query() query: ProductQueryDto,
    @Req() req: import('express').Request,
    @User() currentUser?: AuthUser,
  ) {
    const storeIdHeader = req.headers['x-store-id'];

    // If user is logged in, use their storeId (Customer) or id (Admin).
    // Otherwise use storeIdHeader for guest viewing.
    if (currentUser) {
      query.storeId =
        currentUser.role === 'CUSTOMER' ? currentUser.storeId : currentUser.id;
    } else if (storeIdHeader) {
      query.storeId = parseInt(storeIdHeader as string, 10);
    } else {
      throw new UnauthorizedException(
        'Store ID is required for guest access, or a valid token is required for user access.',
      );
    }

    return this.products.findAll(query);
  }

  @Get('alerts')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get inventory alerts' })
  getAlerts(
    @Query() query: ProductAlertQueryDto,
    @Req() req: import('express').Request,
    @User() currentUser?: AuthUser,
  ) {
    const storeIdHeader = req.headers['x-store-id'];
    let targetStoreId: number | undefined;

    if (currentUser) {
      targetStoreId =
        currentUser.role === 'CUSTOMER' ? currentUser.storeId : currentUser.id;
    } else if (storeIdHeader) {
      targetStoreId = parseInt(storeIdHeader as string, 10);
    } else {
      throw new UnauthorizedException('Authentication or Store ID required');
    }
    return this.products.getAlerts(query, targetStoreId);
  }

  @Get('stock-forecast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stock depletion forecast for all products' })
  getStockForecast(@User('id') userId: number, @Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    return this.products.getStockForecast(userId, d);
  }

  @Get('stats/monthly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current month vs previous month product statistics',
  })
  getMonthlyStats(@User('id') userId: number) {
    return this.products.getMonthlyStats(userId);
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

  @Post('from-ai')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiBody({ type: CreateProductFromAiDto })
  @ApiOperation({
    summary: 'Create product from AI generated data (supports image URLs)',
  })
  createFromAi(
    @User('id') userId: number,
    @Body()
    dto: CreateProductFromAiDto,
  ) {
    return this.products.createFromAi(userId, dto);
  }

  @Post('generate-content/stream')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiBody({ type: GenerateContentStreamDto })
  @ApiOperation({ summary: 'Proxy AI Content Generator SSE Stream' })
  async proxyGenerateContentStream(
    @Body() body: GenerateContentStreamDto,
    @Req() req: import('express').Request,
    @Res() res: import('express').Response,
  ) {
    try {
      const aiCoreUrl =
        this.configService.get<string>('AI_CORE_URL') ||
        'http://localhost:8080';
      const authHeader = req.headers.authorization;

      const response = await fetch(
        `${aiCoreUrl}/api/v1/content/generate/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({
            prompt: body.prompt,
            ...(body.selectedFields?.length
              ? { selected_fields: body.selectedFields }
              : {}),
            ...(body.existingContent
              ? { existing_content: body.existingContent }
              : {}),
            ...(body.mode ? { mode: body.mode } : {}),
          }),
        },
      );

      if (!response.body) {
        throw new Error('No body in response');
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const readable = Readable.fromWeb(
        response.body as import('stream/web').ReadableStream,
      );
      readable.pipe(res);
    } catch (error) {
      console.error('Failed to proxy AI stream:', error);
      res.status(500).json({ error: 'Failed to proxy AI stream' });
    }
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
