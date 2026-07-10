import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductAlertQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', 'high', 'medium', 'low'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'high', 'medium', 'low'])
  severity?: 'all' | 'high' | 'medium' | 'low';

  @ApiPropertyOptional({
    enum: ['all', 'active', 'resolved'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'active', 'resolved'])
  status?: 'all' | 'active' | 'resolved';
}
