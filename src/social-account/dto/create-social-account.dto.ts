import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateSocialAccountDto {
  @IsOptional()
  @IsString()
  accountName!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsString()
  accountId!: string;

  @IsOptional()
  @IsString()
  pageId?: string;

  @IsOptional()
  @IsString()
  accessToken!: string;

  @IsOptional()
  @IsBoolean()
  isActive!: boolean;

  @IsOptional()
  @IsNumber()
  platformId!: number;
}
