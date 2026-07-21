import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CreateNewsApiConfigDto } from './dto/create-news-api-config.dto';
import { UpdateNewsApiConfigDto } from './dto/update-news-api-config.dto';
import { PrismaService } from 'src/prisma/PrismaService/prisma.service';
@Injectable()
export class AiConfigService {
  private readonly logger = new Logger(AiConfigService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async checkAIPostQuota(userId: number) {
    let limit = 50;

    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: 'AI_POST_LIMIT' },
      });
      if (setting) {
        limit = parseInt(setting.value, 10) || 50;
      }
    } catch (e) {
      this.logger.error('Failed to get AI_POST_LIMIT', e);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const publishedCount = await this.prisma.socialPost.count({
      where: {
        status: 'PUBLISHED',
        productId: null,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
        generatedContent: {
          userId,
        },
      },
    });

    if (publishedCount >= limit) {
      throw new HttpException(
        'Bạn đã vượt quá số lượng bài đăng AI trong tháng này.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async createNewsApiConfig(userId: number, dto: CreateNewsApiConfigDto) {
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            'NEWS_API_KEY',
            'NEWS_RUN_INTERVAL',
            'NEWS_POST_COUNT',
            'NEWS_IMAGE_COUNT',
          ],
        },
      },
    });

    const getSettingValue = (key: string, defaultValue: string) => {
      const s = settings.find((s) => s.key === key);
      return s ? s.value : defaultValue;
    };

    const apiKey = getSettingValue('NEWS_API_KEY', '');
    const loopHour =
      parseInt(getSettingValue('NEWS_RUN_INTERVAL', '2'), 10) || 2;
    const targetPostCount =
      parseInt(getSettingValue('NEWS_POST_COUNT', '1'), 10) || 1;
    const imageRequirement =
      parseInt(getSettingValue('NEWS_IMAGE_COUNT', '1'), 10) || 1;

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
          apiKey,
          loopHour,
          targetPostCount,
          imageRequirement,
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

    // Check quota khi bật isActive từ false -> true
    if (dto.isActive === true && !config.isActive) {
      await this.checkAIPostQuota(userId);
    }

    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            'NEWS_API_KEY',
            'NEWS_RUN_INTERVAL',
            'NEWS_POST_COUNT',
            'NEWS_IMAGE_COUNT',
          ],
        },
      },
    });

    const getSettingValue = (key: string, defaultValue: string) => {
      const s = settings.find((s) => s.key === key);
      return s ? s.value : defaultValue;
    };

    const apiKey = getSettingValue('NEWS_API_KEY', '');
    const loopHour =
      parseInt(getSettingValue('NEWS_RUN_INTERVAL', '2'), 10) || 2;
    const targetPostCount =
      parseInt(getSettingValue('NEWS_POST_COUNT', '1'), 10) || 1;
    const imageRequirement =
      parseInt(getSettingValue('NEWS_IMAGE_COUNT', '1'), 10) || 1;

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
        data: {
          ...dto,
          apiKey,
          loopHour,
          targetPostCount,
          imageRequirement,
        },
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

  async deleteNewsApiConfig(id: number, userId: number) {
    const config = await this.prisma.newsAPIConfig.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!config) {
      throw new NotFoundException('News API Config not found');
    }

    if (config.isActive) {
      throw new BadRequestException('Cannot delete active configuration');
    }

    return this.prisma.newsAPIConfig.delete({
      where: { id },
    });
  }
}
