import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateSocialPostDto } from './dto/create-social-post.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

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

  async socialPosts(query: PaginationQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;

      const where = {};

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
            comments: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            generatedContent: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
                socialPosts: {
                  include: {
                    platform: true,
                  },
                },
              },
            },
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

  createSocialPost(dto: CreateSocialPostDto) {
    return this.prisma.socialPost.create({
      data: {
        ...dto,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      },
    });
  }
}
