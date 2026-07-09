import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { SocialPostStatus } from 'src/common/dto/pagination-query.dto';

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

  @ApiProperty({ enum: SocialPostStatus })
  @IsEnum(SocialPostStatus)
  status!: SocialPostStatus;
}
