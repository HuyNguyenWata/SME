import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  async create(dto: CreateProductDto, images: Express.Multer.File[]) {
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

    const created = await this.products.create(dto, imageUrls);

    return this.toResponse(created);
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    images: Express.Multer.File[],
  ) {
    await this.findOne(id);
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

    const updated = await this.products.update(id, dto, imageUrls);

    return this.toResponse(updated!);
  }
  async removeMany(ids: number[]) {
    await this.products.removeMany(ids);
    return { ids };
  }

  private toResponse(product: {
    id: number;
    userId: number;
    name: string;
    description: string | null;
    price: unknown;
    quantity: number;
    unit: string;
    sku: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
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
      unit: product.unit,
      sku: product.sku,
      status: product.status,
      images: product.images ?? [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
