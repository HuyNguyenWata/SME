import { Module } from '@nestjs/common';
import { SocialAccountController } from './social-account.controller';
import { SocialAccountService } from './social-account.service';

@Module({
  controllers: [SocialAccountController],
  providers: [SocialAccountService],
})
export class SocialAccountModule {}
