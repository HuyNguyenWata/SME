import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { Headers, UnauthorizedException } from '@nestjs/common';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'JWT token pair and user profile' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto, @Headers('x-store-id') storeIdHeader?: string) {
    const parsedStoreId = storeIdHeader
      ? parseInt(storeIdHeader, 10)
      : undefined;
    const storeId =
      parsedStoreId && !isNaN(parsedStoreId) ? parsedStoreId : undefined;
    return this.auth.login(dto, storeId);
  }

  @Post('customer/register')
  @ApiOperation({ summary: 'Register a customer for a store' })
  @ApiBody({ type: CustomerRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'JWT token pair and customer profile',
  })
  customerRegister(
    @Body() dto: CustomerRegisterDto,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const storeId = storeIdHeader ? parseInt(storeIdHeader, 10) : undefined;
    if (!storeId || isNaN(storeId)) {
      throw new UnauthorizedException(
        'x-store-id header is required for customer authentication',
      );
    }
    return this.auth.customerRegister(storeId, dto);
  }

  @Post('customer/login')
  @ApiOperation({ summary: 'Login customer for a store' })
  @ApiBody({ type: CustomerLoginDto })
  customerLogin(
    @Body() dto: CustomerLoginDto,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const storeId = storeIdHeader ? parseInt(storeIdHeader, 10) : undefined;
    if (!storeId || isNaN(storeId)) {
      throw new UnauthorizedException(
        'x-store-id header is required for customer authentication',
      );
    }
    return this.auth.customerLogin(storeId, dto);
  }

  @Get('store/:id/check')
  @ApiOperation({ summary: 'Check if a store ID is valid' })
  checkStore(@Param('id') id: string) {
    const storeId = parseInt(id, 10);
    if (isNaN(storeId)) {
      return { valid: false };
    }
    return this.auth.checkStore(storeId);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT token pair' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  logout() {
    return this.auth.logout();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.currentUser(user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Start password reset flow' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Complete password reset flow' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword();
  }
}
