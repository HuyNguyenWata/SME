import { IsIn, IsString } from 'class-validator';

export class ValidateFacebookDto {
  @IsString()
  accessToken!: string;

  @IsString()
  @IsIn(['facebook', 'instagram'])
  platform!: 'facebook' | 'instagram';
}
