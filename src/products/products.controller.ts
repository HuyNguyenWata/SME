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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
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

  @Post()
  //@UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN')
  // @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Create product' })
  create(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(dto, images);
  }

  @Patch(':id')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles('ADMIN')
  // @ApiBearerAuth()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() dto: UpdateProductDto,
  ) {
    console.log(dto);
    console.log(images);

    return this.products.update(parseId(id), dto, images);
  }

  @Delete()
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles('ADMIN')
  // @ApiBearerAuth()
  @ApiBody({ type: DeleteProductsDto })
  @ApiOperation({ summary: 'Delete products' })
  removeMany(@Body() dto: DeleteProductsDto) {
    console.log('BODY:', dto);
    return this.products.removeMany(dto.ids);
  }
}
