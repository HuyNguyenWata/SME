import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
export enum SocialPostStatus {
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
}

export const SocialPostStatusFilterValues = [
  'ALL',
  ...Object.values(SocialPostStatus),
] as const;

export type SocialPostStatusFilter =
  (typeof SocialPostStatusFilterValues)[number];

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
export type PlatformFilter = number | 'ALL';
export class SocialPostQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: SocialPostStatusFilterValues,
  })
  @IsOptional()
  @IsIn(SocialPostStatusFilterValues)
  status?: SocialPostStatusFilter;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'ALL') return 'ALL';
    return Number(value);
  })
  platformId?: PlatformFilter;
}
