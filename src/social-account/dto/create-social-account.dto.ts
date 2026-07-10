import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateSocialAccountDto {
  @IsInt()
  platformId: number;

  @IsString()
  accountName: string;

  @IsString()
  accountId: string;

  @IsOptional()
  @IsString()
  pageId?: string;

  @IsOptional()
  @IsString()
  instagramId?: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  tokenExpiresAt?: string;

  @IsOptional()
  @IsString()
  appId?: string;

  @IsOptional()
  @IsString()
  appSecret?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
