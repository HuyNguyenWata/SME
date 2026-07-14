import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/PrismaModule/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductsService, CloudinaryService],
  exports: [ProductsService],
})
export class ProductsModule {}
