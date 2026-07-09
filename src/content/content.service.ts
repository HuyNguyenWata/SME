import { Injectable } from '@nestjs/common';
import {
  PaginationQueryDto,
  SocialPostQueryDto,
} from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateSocialPostDto } from './dto/create-social-post.dto';
import {
  CreateGeneratedContentDto,
  CreateSocialCalendarDto,
} from './dto/create-generated-content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getNewsCategories() {
    const data = await this.prisma.newsCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return {
      data,
    };
  }

  async calendar(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    return this.prisma.socialCalendar.findMany({
      where: {
        publishAt: {
          gte: start,
          lt: end,
        },
      },
      include: {
        platform: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        generatedContent: true,
        socialPosts: {
          include: {
            platform: true,
          },
        },
      },
      orderBy: {
        publishAt: 'asc',
      },
    });
  }

  async findAllSocialPlatform() {
    return this.prisma.socialPlatform.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async generated(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    return await this.prisma.generatedContent.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
      include: { socialPosts: true },
    });
  }

  async mySocialPosts(query: SocialPostQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const where = {
        ...(query.status &&
          query.status !== 'ALL' && {
            status: query.status,
          }),

        ...(query.platformId &&
          query.platformId !== 'ALL' && {
            platformId: Number(query.platformId),
          }),
        productId: {
          not: null,
        },
      };

      const [items, total] = await Promise.all([
        this.prisma.socialPost.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: query.sortOrder ?? 'desc',
          },
          include: {
            platform: true,
            generatedContent: true,
          },
        }),

        this.prisma.socialPost.count({
          where,
        }),
      ]);

      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (e) {
      console.error('SOCIAL POST ERROR:', e);
      throw e;
    }
  }

  async aiSocialPosts(query: SocialPostQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const where = {
        ...(query.status &&
          query.status !== 'ALL' && {
            status: query.status,
          }),

        ...(query.platformId &&
          query.platformId !== 'ALL' && {
            platformId: Number(query.platformId),
          }),
        productId: null,
      };

      const [items, total] = await Promise.all([
        this.prisma.socialPost.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: query.sortOrder ?? 'desc',
          },
          include: {
            platform: true,
            generatedContent: true,
          },
        }),

        this.prisma.socialPost.count({
          where,
        }),
      ]);

      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (e) {
      console.error('SOCIAL POST ERROR:', e);
      throw e;
    }
  }

  async allMySocialPosts() {
    try {
      const where = {
        productId: {
          not: null,
        },
      };

      const [items, total] = await Promise.all([
        this.prisma.socialPost.findMany({
          where,
          include: {
            platform: true,
            generatedContent: true,
          },
        }),

        this.prisma.socialPost.count({
          where,
        }),
      ]);

      return {
        items,
        meta: {
          total,
        },
      };
    } catch (e) {
      console.error('SOCIAL POST ERROR:', e);
      throw e;
    }
  }

  async allAiSocialPosts() {
    try {
      const where = {
        productId: null,
      };

      const [items, total] = await Promise.all([
        this.prisma.socialPost.findMany({
          where,
          include: {
            platform: true,
            generatedContent: true,
          },
        }),

        this.prisma.socialPost.count({
          where,
        }),
      ]);

      return {
        items,
        meta: {
          total,
        },
      };
    } catch (e) {
      console.error('SOCIAL POST ERROR:', e);
      throw e;
    }
  }

  createSocialPost(dto: CreateSocialPostDto) {
    return this.prisma.socialPost.create({
      data: {
        ...dto,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      },
    });
  }

  async createGeneratedContent(dto: CreateGeneratedContentDto) {
    return this.prisma.generatedContent.create({
      data: {
        title: dto.title,
        relevant: dto.relevant,
        reason: dto.reason,
        facebook_post: dto.facebook_post,
        website_article: dto.website_article,
        hashtags: dto.hashtags,
        seo_keywords: dto.seo_keywords,

        SourceArticle: dto.source_article_id
          ? {
              connect: {
                id: dto.source_article_id,
              },
            }
          : undefined,

        user: dto.userId
          ? {
              connect: {
                id: dto.userId,
              },
            }
          : undefined,
      },
      include: {
        SourceArticle: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async createSocialCalendar(dto: CreateSocialCalendarDto) {
    return this.prisma.socialCalendar.create({
      data: {
        status: dto.status,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,

        product: dto.productId
          ? {
              connect: {
                id: dto.productId,
              },
            }
          : undefined,

        campaign: dto.campaignId
          ? {
              connect: {
                id: dto.campaignId,
              },
            }
          : undefined,

        platform: {
          connect: {
            id: dto.platformId,
          },
        },

        generatedContent: {
          connect: {
            id: dto.generatedContentId,
          },
        },
      },
      include: {
        product: true,
        campaign: true,
        platform: true,
        generatedContent: true,
      },
    });
  }
}
