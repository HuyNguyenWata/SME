import { Module } from '@nestjs/common';
import { SocialPlatformController } from './social-platform.controller';
import { SocialPlatformService } from './social-platform.service';

@Module({
  controllers: [SocialPlatformController],
  providers: [SocialPlatformService],
})
export class SocialPlatformModule {}
