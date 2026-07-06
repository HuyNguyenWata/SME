import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateGeneratedContentDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebook_post?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website_article?: string;

  @ApiPropertyOptional()
  @IsOptional()
  hashtags?: any;

  @ApiPropertyOptional()
  @IsOptional()
  seo_keywords?: any;
}
