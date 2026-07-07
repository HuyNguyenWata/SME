import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { ProductEmbeddingStatus } from './enums/product-status.enum';

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private triggerAiCoreSync(
    product: Record<string, unknown>,
    changedFields?: string[],
  ) {
    const aiCoreUrl = process.env.AI_CORE_URL || 'http://localhost:8080';
    const payload = changedFields
      ? { product, changed_fields: changedFields }
      : { product };
    try {
      fetch(`${aiCoreUrl}/api/v1/products/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((err) =>
        console.error(
          'Error connecting to AI Core when syncing product:',
          err instanceof Error ? err.message : err,
        ),
      );
    } catch (error) {
      console.error(
        'Error connecting to AI Core (initiate sync):',
        error instanceof Error ? error.message : error,
      );
    }
  }

  private triggerAiCoreDelete(productIds: number[]) {
    const aiCoreUrl = process.env.AI_CORE_URL || 'http://localhost:8080';
    try {
      fetch(`${aiCoreUrl}/api/v1/products/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: productIds }),
      }).catch((err) =>
        console.error(
          'Error connecting to AI Core when deleting product:',
          err instanceof Error ? err.message : err,
        ),
      );
    } catch (error) {
      console.error(
        'Error connecting to AI Core (initiate delete):',
        error instanceof Error ? error.message : error,
      );
    }
  }

  async findAll(query: ProductQueryDto) {
    const [items, total] = await this.products.findMany(query);
    return {
      items: items.map((product) => this.toResponse(product)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(id: number) {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return this.toResponse(product);
  }

  async findByIds(ids: number[]) {
    if (!ids || ids.length === 0) return [];
    const products = await this.products.findByIds(ids);
    return products.map((p) => this.toResponse(p));
  }

  async syncProduct(id: number) {
    const product = await this.findOne(id);
    await this.updateEmbeddingStatus(id, ProductEmbeddingStatus.PENDING);
    this.triggerAiCoreSync(product);
    return { success: true, message: 'Sync triggered' };
  }

  async create(
    userId: number,
    dto: CreateProductDto,
    images: Express.Multer.File[],
  ) {
    const internalDto = {
      ...dto,
      userId,
      embeddingStatus: ProductEmbeddingStatus.PENDING,
    };
    const imageUrls = images?.length
      ? await Promise.all(
          images.map(async (file, index) => {
            const uploaded = await this.cloudinaryService.upload(file);

            return {
              url: uploaded.secure_url,
              isThumbnail: index === 0,
              sortOrder: index,
            };
          }),
        )
      : [];

    const created = await this.products.create(internalDto, imageUrls);
    const response = this.toResponse(created);

    // Trigger vector db sync asynchronously
    this.triggerAiCoreSync(response);

    return response;
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    images: Express.Multer.File[],
  ) {
    const oldProduct = await this.findOne(id);

    // Calculate changed fields
    const changedFields: string[] = [];
    if (dto.name && dto.name !== oldProduct.name) changedFields.push('name');
    if (
      dto.description !== undefined &&
      dto.description !== oldProduct.description
    )
      changedFields.push('description');
    if (
      dto.specifications !== undefined &&
      JSON.stringify(dto.specifications) !==
        JSON.stringify(oldProduct.specifications)
    )
      changedFields.push('specifications');

    const needsAiSync = changedFields.length > 0;

    const internalDto = {
      ...dto,
      ...(needsAiSync
        ? { embeddingStatus: ProductEmbeddingStatus.PENDING }
        : {}),
    };

    const imageUrls = images?.length
      ? await Promise.all(
          images.map(async (file, index) => {
            const uploaded = await this.cloudinaryService.upload(file);

            return {
              url: uploaded.secure_url,
              isThumbnail: index === 0,
              sortOrder: index,
            };
          }),
        )
      : [];

    const updated = await this.products.update(id, internalDto, imageUrls);
    const response = this.toResponse(updated!);

    // Trigger vector db sync asynchronously
    if (needsAiSync) {
      this.triggerAiCoreSync(response, changedFields);
    }

    return response;
  }
  async updateEmbeddingStatus(id: number, status: ProductEmbeddingStatus) {
    await this.products.updateEmbeddingStatus(id, status);
    return { success: true };
  }

  async removeMany(ids: number[]) {
    await this.products.removeMany(ids);
    this.triggerAiCoreDelete(ids);
    return { ids };
  }

  private toResponse(product: {
    id: number;
    userId: number;
    name: string;
    description: string | null;
    price: unknown;
    quantity: number;
    lowStockThreshold: number;
    hasBeenOut: boolean;
    unit: string;
    sku: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    specifications?: Prisma.JsonValue;
    embeddingStatus?: string | null;
    images?: {
      id: number;
      url: string;
      isThumbnail: boolean;
      sortOrder: number;
    }[];
    user?: {
      id: number;
      name: string;
      category?: { id: number; name: string } | null;
    };
  }) {
    return {
      id: product.id,
      userId: product.userId,
      owner: product.user
        ? {
            id: product.user.id,
            name: product.user.name,
            category: product.user.category,
          }
        : undefined,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold,
      hasBeenOut: product.hasBeenOut,
      isLowStock:
        product.hasBeenOut && product.quantity <= product.lowStockThreshold,
      unit: product.unit,
      sku: product.sku,
      status: product.status,
      embeddingStatus: product.embeddingStatus,
      images: product.images ?? [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      specifications: product.specifications,
    };
  }
}
