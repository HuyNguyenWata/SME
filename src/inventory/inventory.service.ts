import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateInventoryHistoryDto } from './dto/create-inventory-history.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const where = query.search
      ? {
          product: {
            name: { contains: query.search, mode: 'insensitive' as const },
          },
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.inventoryHistory.findMany({
        where,
        include: { product: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
      }),
      this.prisma.inventoryHistory.count({ where }),
    ]);
    return {
      items: items.map((event) => ({
        id: event.id,
        productId: event.productId,
        productName: event.product.name,
        type: event.type,
        changeQuantity: event.changeQuantity,
        reason: event.reason,
        createdAt: event.createdAt,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async create(dto: CreateInventoryHistoryDto) {
    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inventoryHistory.create({ data: dto });
      await tx.product.update({
        where: { id: dto.productId },
        data: { quantity: { increment: dto.changeQuantity } },
      });
      return created;
    });
    return event;
  }
}
