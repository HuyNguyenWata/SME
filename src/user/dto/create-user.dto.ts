import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6 })
  @MinLength(6)
  password!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'my-store',
    description: 'URL-friendly slug (lowercase, numbers, hyphens only)',
  })
  @IsNotEmpty()
  @Matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
    message:
      'slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen',
  })
  @MinLength(3)
  slug!: string;

  @ApiProperty({ enum: ['ADMIN', 'USER'] })
  @IsIn(['ADMIN', 'USER'])
  role!: 'ADMIN' | 'USER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
