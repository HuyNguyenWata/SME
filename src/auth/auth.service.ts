import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { FacebookLoginDto } from './dto/facebook-login.dto';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpsertMetaAppConfigDto } from '../common/dto/upsert-meta-app-config.dto';
import { MetaAppConfigService } from '../common/services/meta-app-config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly cloudinary: CloudinaryService,
    private readonly metaAppConfig: MetaAppConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already exists');

    const slugExists = await this.prisma.user.findUnique({
      where: { slug: dto.slug },
    });
    if (slugExists) throw new ConflictException('Slug already exists');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: await bcrypt.hash(dto.password, 12),
        name: dto.name,
        slug: dto.slug,
        role: dto.role ?? 'USER',
        categoryId: dto.categoryId,
        isActive: true,
      },
    });

    if (dto.guestId) {
      await this.prisma.conversation.updateMany({
        where: { guestId: dto.guestId },
        data: { storeId: user.id, guestId: null },
      });
    }

    return this.createTokenResponse(user);
  }

  async login(dto: LoginDto, storeId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (storeId && user.role === 'ADMIN' && user.id !== storeId) {
      throw new UnauthorizedException(
        'Admin does not have access to this store',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (dto.guestId) {
      await this.prisma.conversation.updateMany({
        where: { guestId: dto.guestId },
        data: { storeId: user.id, guestId: null },
      });
    }

    return this.createTokenResponse(user);
  }

  getPublicFacebookLoginConfig() {
    return this.metaAppConfig.getPublicConfig();
  }

  upsertFacebookLoginConfig(dto: UpsertMetaAppConfigDto) {
    return this.metaAppConfig.upsertConfig(dto);
  }

  removeFacebookLoginConfig() {
    return this.metaAppConfig.removeConfig();
  }

  async facebookLogin(dto: FacebookLoginDto) {
    const fbConfig = await this.metaAppConfig.getConfig();
    if (!fbConfig) {
      throw new BadRequestException('Facebook login is not configured yet');
    }
    const { appId, appSecret, graphApiVersion } = fbConfig;

    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${dto.accessToken}&access_token=${appId}|${appSecret}`,
    );
    const debug = (await debugRes.json()) as {
      data?: { is_valid?: boolean; app_id?: string };
      error?: { message: string };
    };
    if (!debugRes.ok || debug.error || !debug.data?.is_valid || debug.data.app_id !== appId) {
      throw new BadRequestException('Invalid Facebook access token');
    }

    const meRes = await fetch(
      `https://graph.facebook.com/${graphApiVersion}/me?fields=id,name,email,picture.type(large)&access_token=${dto.accessToken}`,
    );
    const me = (await meRes.json()) as {
      id: string;
      name: string;
      email?: string;
      picture?: { data?: { url?: string } };
      error?: { message: string };
    };

    if (!meRes.ok || me.error) {
      throw new BadRequestException(
        me.error?.message || 'Invalid Facebook access token',
      );
    }

    if (!me.email) {
      throw new BadRequestException(
        'Facebook account has no verified email. Please grant email permission or register manually.',
      );
    }

    const avatarUrl = me.picture?.data?.url;
    const email = me.email.toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { facebookId: me.id },
    });

    if (!user) {
      // Link to an existing local account with the same (Facebook-verified) email.
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        user = await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            facebookId: me.id,
            avatarUrl: existing.avatarUrl ?? avatarUrl,
          },
        });
      }
    }

    if (!user) {
      const slug = await this.generateUniqueSlug(me.name, me.id);
      user = await this.prisma.user.create({
        data: {
          email,
          name: me.name,
          slug,
          role: 'ADMIN',
          provider: 'FACEBOOK',
          facebookId: me.id,
          avatarUrl,
          isActive: true,
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    return this.createTokenResponse(user);
  }

  private async generateUniqueSlug(name: string, facebookId: string) {
    const base =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || `fb-${facebookId}`;

    let slug = base;
    let suffix = 2;
    while (await this.prisma.user.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }

  async checkStore(slug: string) {
    const store = await this.prisma.user.findUnique({
      where: { slug },
    });
    return { valid: !!store && store.role === 'ADMIN' };
  }

  async checkStoreById(storeId: number) {
    const store = await this.prisma.user.findUnique({
      where: { id: storeId },
    });
    return { valid: !!store && store.role === 'ADMIN' };
  }

  async storeInfo(slug: string) {
    const store = await this.prisma.user.findFirst({
      where: { slug, role: 'ADMIN' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logoUrl: true,
      },
    });

    if (!store) {
      throw new BadRequestException('Invalid Store slug');
    }

    return store;
  }

  async resolveStoreSlug(slug: string) {
    const store = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
    if (!store) {
      throw new BadRequestException('Store not found');
    }
    return store;
  }

  async updateStoreProfile(
    storeId: number,
    dto: { name?: string; description?: string },
  ) {
    return this.prisma.user.update({
      where: { id: storeId, role: 'ADMIN' },
      data: {
        name: dto.name,
        description: dto.description,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logoUrl: true,
      },
    });
  }

  async uploadStoreLogo(storeId: number, file: Express.Multer.File) {
    const result = await this.cloudinary.upload(file);
    return this.prisma.user.update({
      where: { id: storeId, role: 'ADMIN' },
      data: {
        logoUrl: result.secure_url,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logoUrl: true,
      },
    });
  }

  async customerRegister(storeId: number, dto: CustomerRegisterDto) {
    const storeCheck = await this.checkStoreById(storeId);
    if (!storeCheck.valid) {
      throw new BadRequestException('Invalid Store ID');
    }
    const existing = await this.prisma.customer.findUnique({
      where: {
        email_storeId: {
          email: dto.email.toLowerCase(),
          storeId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Email already registered for this store');
    }

    const customer = await this.prisma.customer.create({
      data: {
        storeId,
        email: dto.email.toLowerCase(),
        password: await bcrypt.hash(dto.password, 12),
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        isActive: true,
      },
    });

    if (dto.guestId) {
      await this.prisma.conversation.updateMany({
        where: { guestId: dto.guestId, storeId: storeId },
        data: { customerId: customer.id, guestId: null },
      });
    }

    return this.createCustomerTokenResponse(customer);
  }

  async customerLogin(storeId: number, dto: CustomerLoginDto) {
    const storeCheck = await this.checkStoreById(storeId);
    if (!storeCheck.valid) {
      throw new BadRequestException('Invalid Store ID');
    }

    const customer = await this.prisma.customer.findUnique({
      where: {
        email_storeId: {
          email: dto.email.toLowerCase(),
          storeId,
        },
      },
    });

    if (!customer || !customer.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, customer.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (dto.guestId) {
      await this.prisma.conversation.updateMany({
        where: { guestId: dto.guestId, storeId: storeId },
        data: { customerId: customer.id, guestId: null },
      });
    }

    return this.createCustomerTokenResponse(customer);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: number;
        email: string;
        role: string;
        type: string;
      }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.isActive)
        throw new UnauthorizedException('Invalid refresh token');
      return this.createTokenResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  currentUser(user: AuthUser) {
    return user;
  }

  forgotPassword(email: string) {
    return {
      email,
      status: 'accepted',
      message:
        'Password reset delivery must be configured with an email provider.',
    };
  }

  resetPassword() {
    return {
      status: 'accepted',
      message:
        'Reset token persistence is not available in the approved schema.',
    };
  }

  logout() {
    return { status: 'ok' };
  }

  private async createTokenResponse(user: {
    id: number;
    email: string;
    slug: string;
    name: string;
    role: string;
    isActive: boolean;
    avatarUrl?: string | null;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: parseInt(
          this.config.get<string>('JWT_EXPIRES_IN') ?? '900',
          10,
        ),
      }),
      this.jwt.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: parseInt(
            this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '604800',
            10,
          ),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        slug: user.slug,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl ?? undefined,
      },
    };
  }

  private async createCustomerTokenResponse(customer: {
    id: number;
    email: string;
    name: string;
    isActive: boolean;
    storeId: number;
  }) {
    const payload = {
      sub: customer.id,
      email: customer.email,
      role: 'CUSTOMER',
      storeId: customer.storeId,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: parseInt(
          this.config.get<string>('JWT_EXPIRES_IN') ?? '900',
          10,
        ),
      }),
      this.jwt.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: parseInt(
            this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '604800',
            10,
          ),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        isActive: customer.isActive,
        storeId: customer.storeId,
      },
    };
  }
}
