import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSocialAccountDto {
  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  platformId?: number;

  @IsOptional()
  @IsString()
  accountId?: string;
}
