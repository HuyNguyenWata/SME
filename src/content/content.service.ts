import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CreateGeneratedContentDto } from './dto/create-generated-content.dto';
import { CreateSocialPostDto } from './dto/create-social-post.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  generated(query: PaginationQueryDto) {
    return this.prisma.generatedContent.findMany({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
      include: { sourceDoc: true, socialPosts: true },
    });
  }

  createGenerated(dto: CreateGeneratedContentDto) {
    return this.prisma.generatedContent.create({ data: dto });
  }

  socialPosts(query: PaginationQueryDto) {
    return this.prisma.socialPost.findMany({
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
