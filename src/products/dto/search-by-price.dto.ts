import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SearchByPriceDto {
  @ApiProperty({ description: 'Store ID (required for store-level filtering)' })
  @IsNumber()
  storeId!: number;

  @ApiPropertyOptional({ description: 'Minimum price in VND' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price in VND' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Product name keyword to search',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description:
      'Sort by price: "asc" (cheapest first) or "desc" (most expensive first)',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortByPrice?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Max number of products to return (default: 5)',
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
