import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { ValidateFacebookDto } from './dto/validate-facebook.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';

type CreateSocialAccountPayload = CreateSocialAccountDto & {
  userId: number;
};

export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
}

export interface InstagramAccountInfo {
  id: string;
  username?: string;
  name?: string;
  pageId: string;
  pageAccessToken: string;
}

export interface FacebookValidateResponse {
  userId: string;
  userName: string;
  isUserToken: boolean;
  facebookPages?: FacebookPageInfo[];
  instagramAccounts?: InstagramAccountInfo[];
  accountId?: string;
  pageId?: string;
  pageAccessToken?: string;
  instagramBusinessAccountId?: string;
}

@Injectable()
export class SocialAccountService {
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

  async findAll(userId?: number) {
    try {
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
    } catch (error) {
      console.log(error);
    }
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

  async createMany(dtos: CreateSocialAccountPayload[]) {
    return this.prisma.socialAccount.createMany({
      data: dtos.map((dto) => ({
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
      })),
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

  async validateFacebookAccount(
    dto: ValidateFacebookDto,
  ): Promise<FacebookValidateResponse> {
    const { accessToken } = dto;

    // ============================
    // 1. Validate token
    // ============================
    const meRes = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=id,name&access_token=${accessToken}`,
    );

    const me = (await meRes.json()) as {
      id: string;
      name: string;
      error?: { message: string };
    };

    if (!meRes.ok || me.error) {
      throw new BadRequestException(
        me.error?.message || 'Invalid Facebook Access Token',
      );
    }

    let isUserToken = false;

    // ============================
    // 2. Check User Token
    // ============================
    const pagesRes = await fetch(
      `https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${accessToken}`,
    );

    const pages = (await pagesRes.json()) as {
      data?: Array<
        FacebookPageInfo & {
          instagram_business_account?: {
            id: string;
            username?: string;
            name?: string;
          };
        }
      >;
      error?: { message: string };
    };

    if (pagesRes.ok && !pages.error && Array.isArray(pages.data)) {
      isUserToken = true;

      const facebookPages: FacebookPageInfo[] = [];
      const instagramAccounts: InstagramAccountInfo[] = [];

      pages.data.forEach((page) => {
        facebookPages.push({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
        });

        if (page.instagram_business_account?.id) {
          instagramAccounts.push({
            id: page.instagram_business_account.id,
            username: page.instagram_business_account.username,
            name: page.instagram_business_account.name,
            pageId: page.id,
            pageAccessToken: page.access_token,
          });
        }
      });

      return {
        userId: me.id,
        userName: me.name,
        isUserToken,
        facebookPages,
        instagramAccounts,
      };
    }

    // ============================
    // 3. Try to check if this is a Page Token
    // ============================
    const pageRes = await fetch(
      `https://graph.facebook.com/v23.0/${me.id}?fields=id,instagram_business_account{id,username,name}&access_token=${accessToken}`,
    );

    const page = (await pageRes.json()) as {
      id?: string;
      instagram_business_account?: {
        id: string;
        username?: string;
        name?: string;
      };
      error?: { message: string };
    };

    if (!pageRes.ok || page.error) {
      throw new BadRequestException(
        pages.error?.message ||
          page.error?.message ||
          'Access Token is not a valid User Token or Page Token.',
      );
    }

    const facebookPages: FacebookPageInfo[] = [
      {
        id: me.id,
        name: me.name,
        access_token: accessToken,
      },
    ];

    const instagramAccounts: InstagramAccountInfo[] = [];

    if (page.instagram_business_account?.id) {
      instagramAccounts.push({
        id: page.instagram_business_account.id,
        username: page.instagram_business_account.username,
        name: page.instagram_business_account.name,
        pageId: me.id,
        pageAccessToken: accessToken,
      });
    }

    return {
      userId: me.id,
      userName: me.name,
      isUserToken: false,
      facebookPages,
      instagramAccounts,
    };
  }
}
