import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MetaAppConfigService } from '../common/services/meta-app-config.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    conversation: {
      updateMany: jest.fn(),
    },
  };

  const jwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_EXPIRES_IN: '900',
        JWT_REFRESH_EXPIRES_IN: '604800',
      };
      return values[key];
    }),
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_SECRET: 'test-jwt-secret-1234567890',
        JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-1234567890',
      };
      return values[key];
    }),
  };

  const activeUser = {
    id: 1,
    email: 'admin@example.com',
    slug: 'my-store',
    name: 'Admin',
    role: 'ADMIN',
    password: 'hashed-password',
    isActive: true,
    avatarUrl: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jwt.signAsync.mockResolvedValue('signed-jwt');

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: CloudinaryService, useValue: {} },
        { provide: MetaAppConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    const dto = {
      email: 'New@Example.com',
      password: 'password123',
      name: 'New User',
      slug: 'new-store',
    };

    it('throws ConflictException when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 1 });

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the slug is already taken', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 2 }); // slug check

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('lowercases the email and hashes the password before creating the user', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce(activeUser);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            password: 'hashed-password',
            role: 'USER',
          }),
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          accessToken: 'signed-jwt',
          refreshToken: 'signed-jwt',
        }),
      );
    });

    it('reassigns guest conversations to the new user when guestId is provided', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce(activeUser);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');

      await service.register({ ...dto, guestId: 'guest-123' });

      expect(prisma.conversation.updateMany).toHaveBeenCalledWith({
        where: { guestId: 'guest-123' },
        data: { storeId: activeUser.id, guestId: null },
      });
    });
  });

  describe('login', () => {
    const dto = { email: 'admin@example.com', password: 'password123' };

    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...activeUser,
        isActive: false,
      });

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when an admin logs into a different store', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(activeUser);

      await expect(service.login(dto, activeUser.id + 1)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns tokens for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login(dto);

      expect(result).toEqual(
        expect.objectContaining({
          accessToken: 'signed-jwt',
          refreshToken: 'signed-jwt',
          user: expect.objectContaining({ email: activeUser.email }),
        }),
      );
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException when the refresh token cannot be verified', async () => {
      jwt.verifyAsync.mockRejectedValueOnce(new Error('bad token'));

      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the token is not a refresh token', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        sub: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
        type: 'access',
      });

      await expect(service.refresh('access-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the user no longer exists or is inactive', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        sub: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
        type: 'refresh',
      });
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('verifies with the refresh secret and issues new tokens for a valid refresh token', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        sub: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
        type: 'refresh',
      });
      prisma.user.findUnique.mockResolvedValueOnce(activeUser);

      const result = await service.refresh('refresh-token');

      expect(jwt.verifyAsync).toHaveBeenCalledWith('refresh-token', {
        secret: 'test-jwt-refresh-secret-1234567890',
      });
      expect(result).toEqual(
        expect.objectContaining({
          accessToken: 'signed-jwt',
          refreshToken: 'signed-jwt',
        }),
      );
    });
  });
});
