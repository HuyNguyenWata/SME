import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryHistoryQueryDto } from './dto/inventory-history-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { InventoryTransactionDto } from './dto/inventory-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InventoryHistoryQueryDto, userId: number) {
    const where: Prisma.InventoryHistoryWhereInput = {
      ...(query.productId ? { productId: query.productId } : {}),
      product: {
        userId,
        ...(query.search
          ? { name: { contains: query.search, mode: 'insensitive' as const } }
          : {}),
      },
    };
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
        data: {
          quantity: { decrement: dto.quantity },
          hasBeenOut: true,
        },
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

  async getSystemAnalytics(userId: number, days: number = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const histories = await this.prisma.inventoryHistory.findMany({
      where: {
        createdAt: { gte: start },
        product: { userId },
      },
      include: {
        product: { select: { id: true, name: true, price: true } },
      },
    });

    const map = new Map<string, { in: number; out: number; revenue: number }>();
    const productMap = new Map<
      number,
      { name: string; in: number; out: number; revenue: number }
    >();

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      map.set(formatDate(d), { in: 0, out: 0, revenue: 0 });
    }

    let totalIn = 0;
    let totalOut = 0;
    let totalRevenue = 0;

    for (const history of histories) {
      const key = formatDate(history.createdAt);

      if (!productMap.has(history.productId)) {
        productMap.set(history.productId, {
          name: history.product.name,
          in: 0,
          out: 0,
          revenue: 0,
        });
      }
      const productEntry = productMap.get(history.productId)!;

      if (map.has(key)) {
        const entry = map.get(key)!;
        if (history.type === 'IN') {
          entry.in += history.changeQuantity;
          totalIn += history.changeQuantity;
          productEntry.in += history.changeQuantity;
        }
        if (history.type === 'OUT') {
          const rev = history.changeQuantity * Number(history.product.price);
          entry.out += history.changeQuantity;
          entry.revenue += rev;
          totalOut += history.changeQuantity;
          totalRevenue += rev;

          productEntry.out += history.changeQuantity;
          productEntry.revenue += rev;
        }
      }
    }

    const flow: { date: string; in: number; out: number; revenue: number }[] =
      [];
    const sortedEntries = [...map.entries()].sort((a, b) =>
      a[0] > b[0] ? 1 : -1,
    );
    for (const [date, data] of sortedEntries) {
      flow.push({ date, in: data.in, out: data.out, revenue: data.revenue });
    }

    const products = [...productMap.entries()]
      .map(([id, data]) => ({
        id,
        name: data.name,
        in: data.in,
        out: data.out,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      flow,
      products,
      stats: {
        totalIn,
        totalOut,
        totalRevenue,
      },
    };
  }
}
