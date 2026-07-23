import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class GetProductsByIdsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids!: number[];

  @ApiPropertyOptional({ description: 'Store ID for store-level filtering' })
  @IsOptional()
  @IsNumber()
  storeId?: number;
}
