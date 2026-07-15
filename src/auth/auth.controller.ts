import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/password-reset.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';

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

  @Get('store/:slug/check')
  @ApiOperation({ summary: 'Check if a store slug is valid' })
  checkStore(@Param('slug') slug: string) {
    return this.auth.checkStore(slug);
  }

  @Get('store/:slug/info')
  @ApiOperation({ summary: 'Get basic information of a store by slug' })
  storeInfo(@Param('slug') slug: string) {
    return this.auth.storeInfo(slug);
  }

  @Get('store/:slug/resolve')
  @ApiOperation({ summary: 'Resolve store slug to numeric id' })
  resolveStoreSlug(@Param('slug') slug: string) {
    return this.auth.resolveStoreSlug(slug);
  }

  @Put('store/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current store profile (name, description)' })
  updateStoreProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: { name?: string; description?: string },
  ) {
    return this.auth.updateStoreProfile(user.id, dto);
  }

  @Post('store/me/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload store logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadStoreLogo(
    @CurrentUser() user: AuthUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.auth.uploadStoreLogo(user.id, file);
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
  resetPassword() {
    return this.auth.resetPassword();
  }
}
