import { Global, Module } from '@nestjs/common';
import { MetaAppConfigService } from './meta-app-config.service';

@Global()
@Module({
  providers: [MetaAppConfigService],
  exports: [MetaAppConfigService],
})
export class MetaAppConfigModule {}
