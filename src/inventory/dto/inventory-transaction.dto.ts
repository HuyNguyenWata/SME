import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class InventoryTransactionDto {
  @ApiProperty({ description: 'Product ID' })
  @IsInt()
  productId!: number;

  @ApiProperty({ description: 'Quantity (must be greater than 0)' })
  @IsInt()
  @Min(1, { message: 'Quantity must be greater than 0' })
  quantity!: number;

  @ApiPropertyOptional({ description: 'Reason for import/export' })
  @IsString()
  @IsOptional()
  reason?: string;
}
