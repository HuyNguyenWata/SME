import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Service liveness check' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async health() {
    let aiCoreStatus = 'down';
    try {
      const aiCoreUrl = process.env.AI_CORE_URL || 'http://localhost:8080';
      const response = await fetch(`${aiCoreUrl}/health`);
      if (response.ok) {
        aiCoreStatus = 'ok';
      }
    } catch (error) {
      console.error('AI Core is unreachable for health check', error);
      aiCoreStatus = 'down';
    }

    return {
      status: 'ok',
      aiCore: aiCoreStatus,
    };
  }
}
