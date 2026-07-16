import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';

import { SocialAccountService } from './social-account.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { ValidateFacebookDto } from './dto/validate-facebook.dto';

import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('social-account')
export class SocialAccountController {
  constructor(private readonly socialAccountService: SocialAccountService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  findAll(@Req() req: { user?: { id?: number } }) {
    return this.socialAccountService.findAll(req?.user?.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.socialAccountService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  create(
    @Body() dto: CreateSocialAccountDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.socialAccountService.create({
      ...dto,
      userId: req.user.id,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateSocialAccountDto,
  ) {
    return this.socialAccountService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.socialAccountService.remove(id);
  }

  @Post('validate-facebook')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  validateFacebook(@Body() dto: ValidateFacebookDto) {
    return this.socialAccountService.validateFacebookAccount(dto);
  }
}
