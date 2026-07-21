/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { ValidateFacebookDto } from './dto/validate-facebook.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { MetaAppConfigService } from '../common/services/meta-app-config.service';

type CreateSocialAccountPayload = CreateSocialAccountDto & {
  userId: number;
};

export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  avatarUrl?: string;
}

export interface InstagramAccountInfo {
  id: string;
  username?: string;
  name?: string;
  pageId: string;
  pageAccessToken: string;
  avatarUrl?: string;
}

export interface FacebookValidateResponse {
  userId: string;
  userName: string;
  avatarUrl?: string;
  isUserToken: boolean;
  facebookPages?: FacebookPageInfo[];
  instagramAccounts?: InstagramAccountInfo[];
  accountId?: string;
  pageId?: string;
  pageAccessToken?: string;
  instagramBusinessAccountId?: string;
}

type RawFacebookPage = FacebookPageInfo & {
  picture?: { data?: { url?: string } };
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
  };
};

@Injectable()
export class SocialAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAppConfig: MetaAppConfigService,
  ) {}

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

        avatarUrl: dto.avatarUrl,

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
        avatarUrl: dto.avatarUrl,
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
    const oldAccount = await this.findOne(id);

    const updateData: {
      accountName?: string;
      isActive?: boolean;

      accountId?: string;
      accessToken?: string;
      avatarUrl?: string;
    } = {
      accountName: dto.accountName,
      isActive: dto.isActive,
      accountId: dto.accountId,
      avatarUrl: dto.avatarUrl,
      accessToken: dto.accessToken,
      ...(dto.accountId && { accountId: dto.accountId }),
    };

    if (dto.accessToken && dto.accessToken !== oldAccount.accessToken) {
      const platformName = oldAccount.platform.name as 'facebook' | 'instagram';

      const result = await this.validateFacebookAccount({
        accessToken: dto.accessToken,
        platform: platformName,
      });

      // Chỉ cập nhật avatarUrl, vì accountId và accessToken đã lấy từ dto
      // (validateFacebookAccount không trả về accountId và pageAccessToken ở level ngoài cùng)
      if (result.avatarUrl) {
        updateData.avatarUrl = result.avatarUrl;
      }
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

  private async exchangeForLongLivedToken(
    accessToken: string,
    appId: string,
    appSecret: string,
    graphApiVersion: string,
  ): Promise<string> {
    const res = await fetch(
      `https://graph.facebook.com/${graphApiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`,
    );
    const data = (await res.json()) as {
      access_token?: string;
      error?: { message: string };
    };
    if (!res.ok || data.error || !data.access_token) {
      throw new BadRequestException(
        data.error?.message || 'Failed to exchange Facebook access token',
      );
    }
    return data.access_token;
  }

  /**
   * When Facebook grants access via its "granular" asset picker (the
   * "reconnect / choose Pages" dialog), `/me/accounts` returns an empty list
   * even though specific Pages were authorized — the grant only shows up in
   * `granular_scopes[].target_ids` from /debug_token. Extract those Page IDs
   * so we can fetch each Page directly instead.
   */
  private async getGranularPageIds(
    accessToken: string,
    appId: string,
    appSecret: string,
    graphApiVersion: string,
  ): Promise<string[]> {
    const pageScopes = new Set([
      'pages_show_list',
      'pages_manage_posts',
      'pages_read_engagement',
    ]);

    const res = await fetch(
      `https://graph.facebook.com/${graphApiVersion}/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`,
    );
    const body = (await res.json()) as {
      data?: {
        granular_scopes?: Array<{ scope: string; target_ids?: string[] }>;
      };
      error?: { message: string };
    };

    if (!res.ok || body.error || !body.data?.granular_scopes) {
      return [];
    }

    const ids = new Set<string>();
    for (const granted of body.data.granular_scopes) {
      if (pageScopes.has(granted.scope)) {
        (granted.target_ids || []).forEach((id) => ids.add(id));
      }
    }
    return Array.from(ids);
  }

  private async fetchPagesByIds(
    pageIds: string[],
    accessToken: string,
    graphApiVersion: string,
  ): Promise<RawFacebookPage[]> {
    const results = await Promise.all(
      pageIds.map(async (id) => {
        const res = await fetch(
          `https://graph.facebook.com/${graphApiVersion}/${id}?fields=id,name,access_token,picture.type(large),instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`,
        );
        const page = (await res.json()) as RawFacebookPage & {
          error?: { message: string };
        };
        return res.ok && !page.error ? page : null;
      }),
    );
    return results.filter((page): page is RawFacebookPage => page !== null);
  }

  async validateFacebookAccount(
    dto: ValidateFacebookDto,
  ): Promise<FacebookValidateResponse> {
    let { accessToken } = dto;

    // Exchange for a long-lived token first so the Page tokens derived from it
    // never expire, using the single platform-wide Meta App.
    const metaConfig = await this.metaAppConfig.getConfig();
    if (metaConfig) {
      accessToken = await this.exchangeForLongLivedToken(
        accessToken,
        metaConfig.appId,
        metaConfig.appSecret,
        metaConfig.graphApiVersion,
      );
    }

    // ============================
    // 1. Validate token
    // ============================
    const meRes = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=id,name,picture.type(large)&access_token=${accessToken}`,
    );

    const me = (await meRes.json()) as {
      id: string;
      name: string;
      picture?: { data?: { url?: string } };
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
      `https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,picture.type(large),instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`,
    );

    const pages = (await pagesRes.json()) as {
      data?: RawFacebookPage[];
      error?: { message: string };
    };

    if (pagesRes.ok && !pages.error && Array.isArray(pages.data)) {
      isUserToken = true;

      let rawPages = pages.data;

      // /me/accounts comes back empty when Facebook granted access via its
      // granular asset picker instead of the classic "manage all my Pages"
      // grant — fall back to fetching the specifically-authorized Pages by ID.
      if (rawPages.length === 0 && metaConfig) {
        const pageIds = await this.getGranularPageIds(
          accessToken,
          metaConfig.appId,
          metaConfig.appSecret,
          metaConfig.graphApiVersion,
        );
        if (pageIds.length > 0) {
          rawPages = await this.fetchPagesByIds(
            pageIds,
            accessToken,
            metaConfig.graphApiVersion,
          );
        }
      }

      const facebookPages: FacebookPageInfo[] = [];
      const instagramAccounts: InstagramAccountInfo[] = [];

      rawPages.forEach((page) => {
        facebookPages.push({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          avatarUrl: page.picture?.data?.url,
        });

        if (page.instagram_business_account?.id) {
          instagramAccounts.push({
            id: page.instagram_business_account.id,
            username: page.instagram_business_account.username,
            name: page.instagram_business_account.name,
            pageId: page.id,
            pageAccessToken: page.access_token,
            avatarUrl: page.instagram_business_account.profile_picture_url,
          });
        }
      });

      return {
        userId: me.id,
        userName: me.name,
        avatarUrl: me.picture?.data?.url,
        isUserToken,
        facebookPages,
        instagramAccounts,
      };
    }

    // ============================
    // 3. Try to check if this is a Page Token
    // ============================
    const pageRes = await fetch(
      `https://graph.facebook.com/v23.0/${me.id}?fields=id,picture.type(large),instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`,
    );

    const page = (await pageRes.json()) as {
      id?: string;
      picture?: { data?: { url?: string } };
      instagram_business_account?: {
        id: string;
        username?: string;
        name?: string;
        profile_picture_url?: string;
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
        avatarUrl: page.picture?.data?.url || me.picture?.data?.url,
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
        avatarUrl: page.instagram_business_account.profile_picture_url,
      });
    }

    return {
      userId: me.id,
      userName: me.name,
      avatarUrl: me.picture?.data?.url,
      isUserToken: false,
      facebookPages,
      instagramAccounts,
    };
  }
}
