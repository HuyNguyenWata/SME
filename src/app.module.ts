import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/PrismaModule/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductsModule } from './products/products.module';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { ChatModule } from './chat/chat.module';
import { ContentModule } from './content/content.module';
import { SettingsModule } from './settings/settings.module';
import { PromptsModule } from './prompts/prompts.module';
import { SocialPlatformModule } from './social-platform/social-platform.module';
import { AiJobModule } from './ai-job/ai-job.module';
import { N8NModule } from './n8n/n8n.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TerminusModule,
    PrismaModule,
    AuthModule,
    UserModule,
    ProductsModule,
    CatalogModule,
    InventoryModule,
    ChatModule,
    ContentModule,
    SettingsModule,
    PromptsModule,
    SocialPlatformModule,
    AiJobModule,
    N8NModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
