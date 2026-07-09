import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNewsApiConfigDto } from './dto/create-news-api-config.dto';
import { UpdateNewsApiConfigDto } from './dto/update-news-api-config.dto';
import { PrismaService } from 'src/prisma/PrismaService/prisma.service';
@Injectable()
export class AiConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async createNewsApiConfig(userId: number, dto: CreateNewsApiConfigDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.newsAPIConfig.updateMany({
        where: {
          userId,
        },
        data: {
          isActive: false,
        },
      });

      return tx.newsAPIConfig.create({
        data: {
          userId,
          ...dto,
          isActive: true,
        },
        include: {
          category: true,
        },
      });
    });
  }

  async updateNewsApiConfig(
    id: number,
    userId: number,
    dto: UpdateNewsApiConfigDto,
  ) {
    const config = await this.prisma.newsAPIConfig.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!config) {
      throw new NotFoundException('News API Config not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.newsAPIConfig.updateMany({
          where: {
            userId,
            NOT: {
              id,
            },
          },
          data: {
            isActive: false,
          },
        });
      }

      return tx.newsAPIConfig.update({
        where: { id },
        data: dto,
        include: {
          category: true,
        },
      });
    });
  }

  async getNewsApiConfigs(userId: number) {
    return this.prisma.newsAPIConfig.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
