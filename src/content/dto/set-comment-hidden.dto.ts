import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCommentHiddenDto {
  @ApiProperty()
  @IsBoolean()
  hidden!: boolean;
}
