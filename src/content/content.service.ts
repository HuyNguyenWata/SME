import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  async calendar(year: number, month: number, userId?: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    return this.prisma.socialCalendar.findMany({
      where: {
        publishAt: {
          gte: start,
          lt: end,
        },
        ...(userId ? { generatedContent: { userId } } : {}),
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

  async generated(query: PaginationQueryDto, userId?: number) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    return await this.prisma.generatedContent.findMany({
      where: userId ? { userId } : {},
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
      include: { socialPosts: true },
    });
  }

  async mySocialPosts(query: SocialPostQueryDto, userId?: number) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const where = {
        ...(userId && {
          generatedContent: { userId },
        }),
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

  async aiSocialPosts(query: SocialPostQueryDto, userId?: number) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const where = {
        ...(userId && {
          generatedContent: { userId },
        }),
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

  async allMySocialPosts(userId?: number) {
    try {
      const where = {
        ...(userId && {
          generatedContent: { userId },
        }),
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

  async allAiSocialPosts(userId?: number) {
    try {
      const where = {
        ...(userId && {
          generatedContent: { userId },
        }),
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
        instagram_post: dto.instagram_post,
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
    const calendar = await this.prisma.socialCalendar.create({
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

    await this.prisma.socialPost.create({
      data: {
        status: dto.status,
        publishedAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
        platformId: dto.platformId,
        generatedContentId: dto.generatedContentId,
        productId: dto.productId,
        socialCalendarId: calendar.id,
      },
    });

    return calendar;
  }

  async syncSocialEngagement(postId: number) {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        platform: true,
        account: true,
        generatedContent: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Social post not found');
    }

    if (!post.postId) {
      throw new BadRequestException(
        'Post has not been published to a platform yet (missing postId)',
      );
    }

    let token = post.account?.accessToken;

    // Nếu post không lưu account (ví dụ AI post dùng chung n8n), thử lấy token từ fanpage của user
    if (!token && post.generatedContent?.userId) {
      const userAccount = await this.prisma.socialAccount.findFirst({
        where: {
          userId: post.generatedContent.userId,
          platformId: post.platformId,
        },
      });
      if (userAccount) {
        token = userAccount.accessToken;
      }
    }

    if (!token) {
      throw new BadRequestException(
        'No social account or access token found for this user/post',
      );
    }

    const platformName = post.platform.name.toLowerCase();
    const externalPostId = post.postId;

    let likesCount = 0;
    let sharesCount = 0;
    let commentsCount = 0;
    let commentsData: any[] = [];

    try {
      if (platformName === 'facebook') {
        const url = `https://graph.facebook.com/v23.0/${externalPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error?.message || 'Failed to fetch Facebook engagement',
          );
        }

        likesCount = data.likes?.summary?.total_count || 0;
        commentsCount = data.comments?.summary?.total_count || 0;
        sharesCount = data.shares?.count || 0;
        commentsData = data.comments?.data || [];
      } else if (platformName === 'instagram') {
        const url = `https://graph.facebook.com/v23.0/${externalPostId}?fields=like_count,comments_count,comments&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error?.message || 'Failed to fetch Instagram engagement',
          );
        }

        likesCount = data.like_count || 0;
        commentsCount = data.comments_count || 0;
        sharesCount = 0; // IG doesn't return shares directly this way
        commentsData = data.comments?.data || [];
      } else {
        throw new BadRequestException(
          `Sync engagement not supported for platform: ${platformName}`,
        );
      }

      // Upsert comments
      for (const comment of commentsData) {
        await this.prisma.socialComment.upsert({
          where: { externalId: comment.id },
          update: {
            content: comment.message || comment.text || '',
            author: comment.from?.name || comment.username || 'Unknown',
          },
          create: {
            socialPostId: post.id,
            externalId: comment.id,
            content: comment.message || comment.text || '',
            author: comment.from?.name || comment.username || 'Unknown',
            createdAt:
              comment.created_time || comment.timestamp
                ? new Date(comment.created_time || comment.timestamp)
                : new Date(),
          },
        });
      }

      // Update post metrics
      const updatedPost = await this.prisma.socialPost.update({
        where: { id: post.id },
        data: {
          likesCount,
          sharesCount,
          commentsCount,
          lastSyncAt: new Date(),
        },
      });

      return updatedPost;
    } catch (error: any) {
      console.error('SYNC ENGAGEMENT ERROR:', error);
      throw new BadRequestException(
        `Failed to sync engagement: ${error.message}`,
      );
    }
  }

  async syncSocialEngagementBulk(postIds: number[]) {
    const results = await Promise.all(
      postIds.map(async (id) => {
        try {
          await this.syncSocialEngagement(id);
          return { id, success: true };
        } catch (error: any) {
          return { id, success: false, error: error.message };
        }
      }),
    );
    return results;
  }
}
