import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductImageDto } from './product-image.dto';

import { ProductStatus } from '../enums/product-status.enum';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty()
  @IsString()
  unit!: string;

  @ApiProperty()
  @IsString()
  sku!: string;

  @ApiProperty({ enum: ProductStatus })
  @IsIn(Object.values(ProductStatus))
  status!: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  specifications?: any;

  @ApiPropertyOptional({ type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
