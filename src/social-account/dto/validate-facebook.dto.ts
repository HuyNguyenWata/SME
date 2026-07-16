import { IsEnum, IsString } from 'class-validator';

export enum SocialPlatform {
  Facebook = 'Facebook',
  Instagram = 'Instagram',
}

export class ValidateFacebookDto {
  @IsString()
  accessToken!: string;

  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @IsString()
  accountName!: string;
}
