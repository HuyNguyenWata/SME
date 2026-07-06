import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateGeneratedContentDto } from './dto/create-generated-content.dto';
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

  createGenerated(dto: CreateGeneratedContentDto) {
    return this.prisma.generatedContent.create({ data: dto });
  }

  async socialPosts(query: PaginationQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;
      return await this.prisma.socialPost.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
        include: { generatedContent: true, comments: true },
      });
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
