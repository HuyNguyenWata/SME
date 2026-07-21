import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FacebookLoginDto {
  @ApiProperty({
    description: 'Facebook user access token obtained via the Facebook JS SDK',
  })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
