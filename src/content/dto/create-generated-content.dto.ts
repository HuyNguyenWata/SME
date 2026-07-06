import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString } from 'class-validator';

export class CreateGeneratedContentDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty({ enum: ['DRAFT', 'APPROVED', 'PUBLISHED'] })
  @IsIn(['DRAFT', 'APPROVED', 'PUBLISHED'])
  status!: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
}
