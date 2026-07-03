import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: ProductQueryDto) {
    try {
      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  sku: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  description: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      };

      return await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            images: {
              where: {
                sortOrder: 0,
              },
              take: 1,
            },
            user: {
              include: {
                category: true,
              },
            },
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: {
            createdAt: query.sortOrder ?? 'desc',
          },
        }),
        this.prisma.product.count({ where }),
      ]);
    } catch (e) {
      console.error('PRISMA FINDMANY ERROR:', e);
      throw e;
    }
  }

  async findById(id: number) {
    try {
      return await this.prisma.product.findUnique({
        where: { id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          comments: { orderBy: { createdAt: 'desc' } },
          user: { include: { category: true } },
        },
      });
    } catch (e) {
      console.error('PRISMA FINDBYID ERROR:', e);
      throw e;
    }
  }

  async create(
    dto: CreateProductDto,
    images: {
      url: string;
      isThumbnail: boolean;
      sortOrder: number;
    }[],
  ) {
    try {
      return await this.prisma.product.create({
        data: {
          userId: dto.userId,
          name: dto.name,
          description: dto.description,
          price: dto.price,
          quantity: dto.quantity,
          unit: dto.unit,
          sku: dto.sku,
          status: dto.status,

          images: images.length
            ? {
                create: images.map((image) => ({
                  url: image.url,
                  isThumbnail: image.isThumbnail,
                  sortOrder: image.sortOrder,
                })),
              }
            : undefined,
        },
        include: {
          images: true,
          user: {
            include: {
              category: true,
            },
          },
        },
      });
    } catch (e) {
      console.error('PRISMA CREATE ERROR:', e);
      throw e;
    }
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    images: {
      url: string;
      isThumbnail: boolean;
      sortOrder: number;
    }[],
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.update({
          where: { id },
          data: {
            userId: dto.userId,
            name: dto.name,
            description: dto.description,
            price: dto.price,
            quantity: dto.quantity,
            unit: dto.unit,
            sku: dto.sku,
            status: dto.status,
          },
        });

        if (images.length > 0) {
          await tx.productImage.deleteMany({
            where: { productId: id },
          });

          await tx.productImage.createMany({
            data: images.map((image) => ({
              productId: id,
              url: image.url,
              isThumbnail: image.isThumbnail,
              sortOrder: image.sortOrder,
            })),
          });
        }

        return tx.product.findUnique({
          where: { id },
          include: {
            images: true,
            user: {
              include: {
                category: true,
              },
            },
          },
        });
      });
    } catch (e) {
      console.error('PRISMA UPDATE ERROR:', e);
      throw e;
    }
  }

  async removeMany(ids: number[]) {
    try {
      await this.prisma.productImage.deleteMany({
        where: { productId: { in: ids } },
      });

      await this.prisma.product.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (e) {
      console.error('PRISMA DELETE ERROR:', e);
      throw e;
    }
  }
}
