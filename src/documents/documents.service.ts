import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateCrawlDocDto } from './dto/create-crawl-doc.dto';
import { CreateRawDocDto } from './dto/create-raw-doc.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async rawDocs(query: PaginationQueryDto) {
    const where = query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' as const } },
            {
              content: { contains: query.search, mode: 'insensitive' as const },
            },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.rawDoc.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
      }),
      this.prisma.rawDoc.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  createRawDoc(dto: CreateRawDocDto) {
    return this.prisma.rawDoc.create({ data: dto });
  }

  async rawDoc(id: number) {
    const doc = await this.prisma.rawDoc.findUnique({
      where: { id },
      include: { crawlDocs: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async removeRawDoc(id: number) {
    await this.rawDoc(id);
    await this.prisma.rawDoc.delete({ where: { id } });
    return { id };
  }

  crawls(query: PaginationQueryDto) {
    return this.prisma.crawlDoc.findMany({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
    });
  }

  createCrawl(dto: CreateCrawlDocDto) {
    return this.prisma.crawlDoc.create({
      data: { ...dto, metadata: dto.metadata as Prisma.InputJsonValue },
    });
  }
}
