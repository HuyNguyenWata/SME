import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSocialPostDto {
  @ApiProperty()
  @IsInt()
  generatedContentId!: number;

  @ApiProperty()
  @IsInt()
  platformId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'] })
  @IsIn(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'])
  status!: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
}
