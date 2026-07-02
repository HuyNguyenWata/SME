import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString } from 'class-validator';

export class CreateInventoryHistoryDto {
  @ApiProperty()
  @IsInt()
  productId!: number;

  @ApiProperty({ enum: ['IN', 'OUT', 'ADJUST'] })
  @IsIn(['IN', 'OUT', 'ADJUST'])
  type!: 'IN' | 'OUT' | 'ADJUST';

  @ApiProperty()
  @IsInt()
  changeQuantity!: number;

  @ApiProperty()
  @IsString()
  reason!: string;
}
