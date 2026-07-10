import {
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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already exists');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: await bcrypt.hash(dto.password, 12),
        name: dto.name,
        role: dto.role ?? 'USER',
        categoryId: dto.categoryId,
        isActive: true,
      },
    });

    if (dto.guestId) {
      await this.prisma.conversation.updateMany({
        where: { guestId: dto.guestId },
        data: { userId: user.id, guestId: null },
      });
    }

    return this.createTokenResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const hash = await bcrypt.hash('123456', 10);
    console.log(hash);
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (dto.guestId) {
      await this.prisma.conversation.updateMany({
        where: { guestId: dto.guestId },
        data: { userId: user.id, guestId: null },
      });
    }

    return this.createTokenResponse(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: number;
        email: string;
        role: string;
        type: string;
      }>(refreshToken, {
        secret:
          this.config.get<string>('JWT_REFRESH_SECRET') ??
          'dev-refresh-secret-change-me',
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
    name: string;
    role: string;
    isActive: boolean;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
        expiresIn: parseInt(
          this.config.get<string>('JWT_EXPIRES_IN') ?? '900',
          10,
        ),
      }),
      this.jwt.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret:
            this.config.get<string>('JWT_REFRESH_SECRET') ??
            'dev-refresh-secret-change-me',
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
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
