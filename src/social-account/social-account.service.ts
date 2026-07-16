/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { SocialPlatform } from './dto/validate-facebook.dto';
export interface FacebookValidateResponse {
  userId: string;
  userName: string;
  accountId: string;
  pageAccessToken: string;
  isUserToken: boolean;
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

  async update(id: number, dto: UpdateSocialAccountDto) {
    const oldAccount = await this.findOne(id);

    const updateData: {
      accountName?: string;
      isActive?: boolean;

      accountId?: string;
      accessToken?: string;
    } = {
      accountName: dto.accountName,
      isActive: dto.isActive,
    };

    if (dto.accessToken) {
      const platformName = oldAccount.platform.name as SocialPlatform;

      const result = await this.validateFacebookAccount(
        dto.accessToken,
        platformName,
      );

      updateData.accountId = result.accountId;

      updateData.accessToken = result.pageAccessToken;
    }

    return this.prisma.socialAccount.update({
      where: {
        id,
      },
      data: updateData,
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
    accessToken: string,
    platform: SocialPlatform,
  ): Promise<FacebookValidateResponse> {
    // ============================
    // 1. Validate token
    // ============================

    const meRes = await fetch(
      'https://graph.facebook.com/v23.0/me?fields=id,name',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const me = await meRes.json();

    if (!meRes.ok || me.error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new Error(me?.error?.message || 'Invalid Facebook Access Token');
    }

    let pageId = '';
    let pageAccessToken = '';
    let isUserToken = false;

    // ============================
    // 2. Check User Token
    // ============================

    const pagesRes = await fetch(
      'https://graph.facebook.com/v23.0/me/accounts',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const pages = await pagesRes.json();

    if (
      pagesRes.ok &&
      !pages.error &&
      Array.isArray(pages.data) &&
      pages.data.length > 0
    ) {
      // User Token
      isUserToken = true;

      pageId = pages.data[0].id;
      pageAccessToken = pages.data[0].access_token;
    } else {
      // ============================
      // 3. Check Page Token
      // ============================

      const pageRes = await fetch(
        `https://graph.facebook.com/v23.0/${me.id}?fields=id`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const page = await pageRes.json();

      if (!pageRes.ok || page.error) {
        throw new Error(
          pages.error?.message ||
            page.error?.message ||
            'Access Token is not valid.',
        );
      }

      pageId = me.id;
      pageAccessToken = accessToken;
    }

    // ============================
    // 4. Facebook
    // ============================

    let accountId = pageId;

    let instagramBusinessAccountId: string | undefined;

    // ============================
    // 5. Instagram
    // ============================

    if (platform === SocialPlatform.Instagram) {
      const igRes = await fetch(
        `https://graph.facebook.com/v23.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`,
      );

      const ig = await igRes.json();

      if (!igRes.ok || ig.error) {
        throw new Error(
          ig.error?.message || 'Cannot access Instagram Business Account',
        );
      }

      if (!ig.instagram_business_account?.id) {
        throw new Error(
          'Facebook Page is not connected to Instagram Business Account',
        );
      }

      instagramBusinessAccountId = ig.instagram_business_account.id;

      accountId = instagramBusinessAccountId || '';
    }

    return {
      userId: me.id,

      userName: me.name,

      accountId,

      pageAccessToken,

      isUserToken,
    };
  }

  async validateAndCreateAccount(
    accessToken: string,
    platformId: number,
    userId: number,
    accountName: string,
  ) {
    // 1. Lấy platform DB trước
    const platformRecord = await this.prisma.socialPlatform.findUnique({
      where: {
        id: platformId,
      },
    });

    if (!platformRecord) {
      throw new NotFoundException('Social platform not found');
    }

    // 2. Convert DB name thành enum
    const platform = platformRecord.name as SocialPlatform;

    // 3. Validate Facebook
    const result = await this.validateFacebookAccount(accessToken, platform);

    // 4. Create
    const account = await this.prisma.socialAccount.create({
      data: {
        userId,

        platformId: platformRecord.id,

        accountName,

        accountId: result.accountId,

        accessToken: result.pageAccessToken,

        isActive: true,
      },
    });

    return {
      id: account.id,
      accountName: account.accountName,
      accountId: account.accountId,
      platformId: account.platformId,
      isActive: account.isActive,
    };
  }
}
