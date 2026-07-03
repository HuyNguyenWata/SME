import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    example: 'New Chat',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;
}
