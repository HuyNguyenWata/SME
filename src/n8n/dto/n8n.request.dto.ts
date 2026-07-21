import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsArray } from 'class-validator';

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
export class InstantSubmitRequestDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  configId!: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  platformIds?: number[];
}

export class InstantSubmitDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  configId!: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  platformIds?: number[];
}

export class WebhookPostSuccessDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  message?: string;
}
