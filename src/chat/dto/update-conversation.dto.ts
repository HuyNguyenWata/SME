import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateConversationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  contextProductId?: number | null;
}
