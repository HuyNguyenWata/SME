import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertMetaAppConfigDto {
  @ApiProperty({ example: '1234567890123456' })
  @IsString()
  @IsNotEmpty()
  appId!: string;

  @ApiPropertyOptional({
    description: 'Leave empty when editing to keep the currently saved secret',
  })
  @IsOptional()
  @IsString()
  appSecret?: string;

  @ApiPropertyOptional({ default: 'v23.0' })
  @IsOptional()
  @IsString()
  graphApiVersion?: string;
}
