import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, IsString, IsUrl } from 'class-validator';

export class CreateCrawlDocDto {
  @ApiProperty()
  @IsInt()
  rawDocId!: number;

  @ApiProperty()
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsObject()
  metadata!: Record<string, unknown>;
}
