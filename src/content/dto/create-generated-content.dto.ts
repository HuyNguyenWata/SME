import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateSocialCalendarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  campaignId?: number;

  @ApiProperty()
  @IsInt()
  platformId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsInt()
  generatedContentId: number;
}

export class CreateGeneratedContentDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  relevant?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebook_post?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website_article?: string;

  @ApiPropertyOptional({
    type: [String],
  })
  @IsOptional()
  @IsArray()
  hashtags?: string[];

  @ApiPropertyOptional({
    type: [String],
  })
  @IsOptional()
  @IsArray()
  seo_keywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  source_article_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagram_post?: string;
}
