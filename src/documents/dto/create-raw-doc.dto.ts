import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString } from 'class-validator';

export class CreateRawDocDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty({ enum: ['MANUAL', 'RSS', 'WEBSITE', 'PDF', 'DOCX'] })
  @IsIn(['MANUAL', 'RSS', 'WEBSITE', 'PDF', 'DOCX'])
  source!: 'MANUAL' | 'RSS' | 'WEBSITE' | 'PDF' | 'DOCX';

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty({ enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'] })
  @IsIn(['PENDING', 'PROCESSING', 'DONE', 'FAILED'])
  status!: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
}
