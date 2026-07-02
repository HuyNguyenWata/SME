import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'OUT_OF_STOCK', 'HIDDEN'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'OUT_OF_STOCK', 'HIDDEN'])
  status?: 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN';
}
