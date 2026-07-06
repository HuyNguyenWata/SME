import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';
import { ProductEmbeddingStatus } from '../enums/product-status.enum';

export class AiSyncWebhookDto {
  @ApiProperty()
  @IsInt()
  productId!: number;

  @ApiProperty({ enum: ProductEmbeddingStatus })
  @IsIn(Object.values(ProductEmbeddingStatus))
  status!: ProductEmbeddingStatus;
}
