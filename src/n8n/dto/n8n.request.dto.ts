import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PublishDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  jobId?: number;
}

export class ContentDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  note?: string;
}
export class InstantSubmitDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  userId!: number;
}
