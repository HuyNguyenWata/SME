import { Global, Module } from '@nestjs/common';
import { AiCoreClientService } from './ai-core-client.service';

@Global()
@Module({
  providers: [AiCoreClientService],
  exports: [AiCoreClientService],
})
export class AiCoreClientModule {}
