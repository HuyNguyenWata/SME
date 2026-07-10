import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

import { PrismaService } from '../prisma/PrismaService/prisma.service';

type CreateSocialAccountPayload = CreateSocialAccountDto & {
  userId: number;
};

@Injectable()
export class SocialAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: number) {
    return this.prisma.socialAccount.findMany({
      where: userId
        ? {
            userId,
          }
        : undefined,

      include: {
        platform: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const account = await this.prisma.socialAccount.findUnique({
      where: {
        id,
      },

      include: {
        platform: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Social account not found');
    }

    return account;
  }

  async create(dto: CreateSocialAccountPayload) {
    return this.prisma.socialAccount.create({
      data: {
        // lấy từ JWT
        userId: dto.userId,

        platformId: dto.platformId,

        accountName: dto.accountName,

        accountId: dto.accountId,

        pageId: dto.pageId,

        instagramId: dto.instagramId,

        accessToken: dto.accessToken,

        refreshToken: dto.refreshToken,

        tokenExpiresAt: dto.tokenExpiresAt
          ? new Date(dto.tokenExpiresAt)
          : null,

        appId: dto.appId,

        appSecret: dto.appSecret,

        webhookSecret: dto.webhookSecret,

        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateSocialAccountDto) {
    await this.findOne(id);

    return this.prisma.socialAccount.update({
      where: {
        id,
      },

      data: {
        ...dto,

        tokenExpiresAt: dto.tokenExpiresAt
          ? new Date(dto.tokenExpiresAt)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.socialAccount.delete({
      where: {
        id,
      },
    });
  }
}
