import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/PrismaModule/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, CloudinaryService], //AuthService, JwtStrategy
  exports: [AuthService],
})
export class AuthModule {}
