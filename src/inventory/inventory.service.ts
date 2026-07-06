import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { InventoryTransactionDto } from './dto/inventory-transaction.dto';

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

  async import(dto: InventoryTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const history = await tx.inventoryHistory.create({
        data: {
          productId: dto.productId,
          type: 'IN',
          changeQuantity: dto.quantity,
          reason: dto.reason,
        },
      });

      await tx.product.update({
        where: { id: dto.productId },
        data: { quantity: { increment: dto.quantity } },
      });

      return history;
    });
  }

  async export(dto: InventoryTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.quantity < dto.quantity) {
        throw new BadRequestException(
          'Insufficient inventory quantity for export',
        );
      }

      const history = await tx.inventoryHistory.create({
        data: {
          productId: dto.productId,
          type: 'OUT',
          changeQuantity: dto.quantity,
          reason: dto.reason,
        },
      });

      await tx.product.update({
        where: { id: dto.productId },
        data: { quantity: { decrement: dto.quantity } },
      });

      return history;
    });
  }
}
