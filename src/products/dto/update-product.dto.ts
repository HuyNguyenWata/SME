import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsOptional } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  existingImages?: string | string[];

  @IsOptional()
  updateImages?: string;

  @IsOptional()
  imageUrls?: string | string[];
}
