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

  @ApiProperty({ enum: ['FACEBOOK', 'LINKEDIN', 'X'] })
  @IsIn(['FACEBOOK', 'LINKEDIN', 'X'])
  platform!: 'FACEBOOK' | 'LINKEDIN' | 'X';

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
