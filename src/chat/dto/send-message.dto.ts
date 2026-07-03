import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty()
  @IsNumber()
  userId!: number;
}
