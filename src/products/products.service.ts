import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { ProductEmbeddingStatus } from './enums/product-status.enum';
import { ProductAlertQueryDto } from './dto/product-alert-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}

  async getMonthlyStats() {
    const now = new Date();

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const [currentMonth, previousMonth] = await Promise.all([
      this.prisma.product.count({
        where: {
          createdAt: {
            gte: currentMonthStart,
            lt: nextMonthStart,
          },
        },
      }),
      this.prisma.product.count({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lt: currentMonthStart,
          },
        },
      }),
    ]);

    const diff = currentMonth - previousMonth;

    return {
      currentMonth,
      previousMonth,
      difference: diff,
      percentage:
        previousMonth === 0
          ? currentMonth > 0
            ? 100
            : 0
          : Number(
              (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(
                1,
              ),
            ),
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'equal',
    };
  }

  async getProductMonthlyStats() {
    const now = new Date();

    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const nextMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    );

    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
      0,
      0,
      0,
      0,
    );

    const [currentMonth, previousMonth] = await Promise.all([
      this.prisma.product.count({
        where: {
          createdAt: {
            gte: currentMonthStart,
            lt: nextMonthStart,
          },
        },
      }),

      this.prisma.product.count({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lt: currentMonthStart,
          },
        },
      }),
    ]);

    const difference = currentMonth - previousMonth;

    const percentage =
      previousMonth === 0
        ? currentMonth > 0
          ? 100
          : 0
        : Number(
            (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1),
          );

    return {
      currentMonth,
      previousMonth,
      difference,
      percentage,
      trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'equal',
    };
  }

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

  async createFromAi(
    userId: number,
    dto: import('./dto/create-product-from-ai.dto').CreateProductFromAiDto,
  ) {
    const { imageUrls: aiImageUrls, aiDescription, ...restDto } = dto;
    const internalDto = {
      ...restDto,
      userId,
      description: aiDescription || restDto.description, // Use AI description if provided
      embeddingStatus: ProductEmbeddingStatus.PENDING,
    };

    const uploadedImages: {
      url: string;
      isThumbnail: boolean;
      sortOrder: number;
    }[] = [];
    if (aiImageUrls?.length) {
      const uploadPromises = aiImageUrls.map((url) =>
        this.cloudinaryService.uploadFromUrl(url).catch((err) => {
          console.error(
            `Failed to upload image from URL: ${url}`,
            err instanceof Error ? err.message : String(err),
          );
          return null;
        }),
      );

      const results = await Promise.all(uploadPromises);

      let index = 0;
      for (const result of results) {
        if (result) {
          uploadedImages.push({
            url: result.secure_url,
            isThumbnail: index === 0,
            sortOrder: index,
          });
          index++;
        }
      }
    }

    const created = await this.products.create(internalDto, uploadedImages);
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
    expiryDate?: Date | null;
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
      expiryDate: product.expiryDate,
      images: product.images ?? [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      specifications: product.specifications,
    };
  }

  async getProductAnalytics(id: number, days: number = 14) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { quantity: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const histories = await this.prisma.inventoryHistory.findMany({
      where: {
        productId: id,
        createdAt: { gte: start },
      },
      select: {
        type: true,
        changeQuantity: true,
        createdAt: true,
      },
    });

    const map = new Map<string, { change: number; in: number; out: number }>();

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      map.set(formatDate(d), { change: 0, in: 0, out: 0 });
    }

    let totalIn = 0;
    let totalOut = 0;

    for (const history of histories) {
      const key = formatDate(history.createdAt);
      if (map.has(key)) {
        const entry = map.get(key)!;
        if (history.type === 'IN') {
          entry.change += history.changeQuantity;
          entry.in += history.changeQuantity;
          totalIn += history.changeQuantity;
        }
        if (history.type === 'OUT') {
          entry.change -= history.changeQuantity;
          entry.out += history.changeQuantity;
          totalOut += history.changeQuantity;
        }
      }
    }

    const inventory: { date: string; value: number }[] = [];
    const flow: { date: string; in: number; out: number }[] = [];
    let invTracker = product.quantity;

    const sortedEntries = [...map.entries()].sort((a, b) =>
      a[0] > b[0] ? -1 : 1,
    );

    for (const [date, data] of sortedEntries) {
      inventory.unshift({ date, value: invTracker });
      flow.unshift({ date, in: data.in, out: data.out });
      invTracker -= data.change;
    }

    return {
      inventory,
      flow,
      stats: {
        totalIn,
        totalOut,
        currentQuantity: product.quantity,
      },
    };
  }

  async getStockForecast(lookbackDays: number = 30) {
    const products = await this.prisma.product.findMany({
      where: { quantity: { gt: 0 }, hasBeenOut: true },
      select: {
        id: true,
        name: true,
        quantity: true,
        lowStockThreshold: true,
        unit: true,
      },
    });

    if (products.length === 0) {
      return {
        items: [],
        summary: { criticalCount: 0, warningCount: 0, safeCount: 0 },
      };
    }

    const start = new Date();
    start.setDate(start.getDate() - lookbackDays);
    start.setHours(0, 0, 0, 0);

    const histories = await this.prisma.inventoryHistory.findMany({
      where: {
        type: 'OUT',
        createdAt: { gte: start },
        productId: { in: products.map((p) => p.id) },
      },
      select: {
        productId: true,
        changeQuantity: true,
      },
    });

    const outMap = new Map<number, number>();
    for (const h of histories) {
      outMap.set(
        h.productId,
        (outMap.get(h.productId) ?? 0) + h.changeQuantity,
      );
    }

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const forecastDays = 30;
    let criticalCount = 0;
    let warningCount = 0;
    let safeCount = 0;

    const items = products
      .map((p) => {
        const totalOut = outMap.get(p.id) ?? 0;
        const avgDailyConsumption =
          totalOut > 0 ? +(totalOut / lookbackDays).toFixed(2) : 0;

        const estimatedDaysLeft =
          avgDailyConsumption > 0
            ? Math.round(p.quantity / avgDailyConsumption)
            : null;

        const severity: 'critical' | 'warning' | 'safe' =
          estimatedDaysLeft === null
            ? 'safe'
            : estimatedDaysLeft < 7
              ? 'critical'
              : estimatedDaysLeft < 14
                ? 'warning'
                : 'safe';

        if (severity === 'critical') criticalCount++;
        else if (severity === 'warning') warningCount++;
        else safeCount++;

        const projectedInventory: { date: string; value: number }[] = [];
        const today = new Date();
        for (let i = 0; i <= forecastDays; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const projected = Math.max(
            0,
            Math.round(p.quantity - avgDailyConsumption * i),
          );
          projectedInventory.push({ date: formatDate(d), value: projected });
        }

        return {
          productId: p.id,
          productName: p.name,
          currentQuantity: p.quantity,
          lowStockThreshold: p.lowStockThreshold,
          unit: p.unit,
          avgDailyConsumption,
          estimatedDaysLeft,
          severity,
          projectedInventory,
        };
      })
      .sort((a, b) => {
        if (a.estimatedDaysLeft === null && b.estimatedDaysLeft === null)
          return 0;
        if (a.estimatedDaysLeft === null) return 1;
        if (b.estimatedDaysLeft === null) return -1;
        return a.estimatedDaysLeft - b.estimatedDaysLeft;
      });

    return {
      items,
      summary: { criticalCount, warningCount, safeCount },
    };
  }

  async getAlerts(query: ProductAlertQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      severity = 'all',
      status = 'all',
    } = query;

    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        quantity: true,
        lowStockThreshold: true,
        unit: true,
        updatedAt: true,
      },
    });

    let alerts = products
      .filter((p) => p.quantity <= p.lowStockThreshold)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        message: `${p.quantity} ${p.unit} remaining`,
        severity:
          p.quantity === 0
            ? ('high' as const)
            : p.quantity <= Math.ceil(p.lowStockThreshold / 2)
              ? ('medium' as const)
              : ('low' as const),
        createdAt: p.updatedAt,
        resolved: false,
      }));

    // Search
    if (search?.trim()) {
      const keyword = search.trim().toLowerCase();

      alerts = alerts.filter(
        (a) =>
          a.productName.toLowerCase().includes(keyword) ||
          a.message.toLowerCase().includes(keyword),
      );
    }

    // Severity
    if (severity !== 'all') {
      alerts = alerts.filter((a) => a.severity === severity);
    }

    // Status
    if (status === 'active') {
      alerts = alerts.filter((a) => !a.resolved);
    }

    if (status === 'resolved') {
      alerts = alerts.filter((a) => a.resolved);
    }

    // ===== Summary (trước pagination) =====
    const summary = {
      active: alerts.filter((a) => !a.resolved).length,
      resolved: alerts.filter((a) => a.resolved).length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter(
        (a) => a.severity !== 'high' && a.severity !== 'medium',
      ).length,
      total: alerts.length,
    };

    // Sort
    const severityOrder = {
      high: 3,
      medium: 2,
      low: 1,
    };

    alerts.sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];

      if (severityDiff !== 0) {
        return severityDiff;
      }

      if (a.resolved !== b.resolved) {
        return Number(a.resolved) - Number(b.resolved);
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = alerts.length;
    const totalPages = Math.ceil(total / limit);

    const items = alerts.slice((page - 1) * limit, page * limit);

    return {
      items,
      summary,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
