import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateGeneratedContentDto } from './dto/create-generated-content.dto';
import { CreateSocialPostDto } from './dto/create-social-post.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async generated(query: PaginationQueryDto) {
    return await this.prisma.generatedContent.findMany({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
      include: { socialPosts: true },
    });
  }

  createGenerated(dto: CreateGeneratedContentDto) {
    return this.prisma.generatedContent.create({ data: dto });
  }

  async socialPosts(query: PaginationQueryDto) {
    return await this.prisma.socialPost.findMany({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
      include: { generatedContent: true, comments: true },
    });
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
