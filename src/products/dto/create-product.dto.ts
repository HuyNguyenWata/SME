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
  IsDateString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductImageDto } from './product-image.dto';

export class CreateProductDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  userId!: number;

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

  @ApiProperty({ enum: ['ACTIVE', 'OUT_OF_STOCK', 'HIDDEN'] })
  @IsIn(['ACTIVE', 'OUT_OF_STOCK', 'HIDDEN'])
  status!: 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  specifications?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  embeddingStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  embeddingUpdatedAt?: string;

  @ApiPropertyOptional({ type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
