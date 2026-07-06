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
  async getDeadStock(thresholdDays: number = 60) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    const products = await this.prisma.product.findMany({
      where: {
        quantity: { gt: 0 },
        createdAt: { lt: thresholdDate },
        inventoryHistories: {
          none: {
            type: 'OUT',
            createdAt: { gte: thresholdDate },
          },
        },
      },
      include: {
        inventoryHistories: {
          where: { type: 'OUT' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const now = Date.now();

    return products
      .map((p) => {
        const lastOutDate =
          p.inventoryHistories.length > 0
            ? p.inventoryHistories[0].createdAt
            : p.createdAt;
        const ageDays = Math.floor(
          (now - lastOutDate.getTime()) / (24 * 60 * 60 * 1000),
        );

        return {
          id: `dead-stock-${p.id}`,
          productId: p.id,
          productName: p.name,
          quantity: p.quantity,
          ageDays,
          severity: ageDays > 120 ? 'high' : 'medium',
          suggestion: this.getLiquidationSuggestion(ageDays),
        };
      })
      .sort((a, b) => b.ageDays - a.ageDays);
  }

  private getLiquidationSuggestion(ageDays: number) {
    if (ageDays > 120) return 'Clearance sale -50% or bundle liquidation';
    if (ageDays > 90) return 'Discount 20–30% + push marketing ads';
    if (ageDays > 60) return 'Bundle with fast-moving products';
    return 'Normal promotion';
  }
}
