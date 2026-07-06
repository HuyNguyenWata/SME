import { Body, Controller, Post } from '@nestjs/common';
import { N8NService } from './n8n.service';
import { PublishDto } from './dto/n8n.request.dto';

@Controller('n8n')
export class N8NController {
  constructor(private readonly n8NService: N8NService) {}

  @Post('facebook')
  async publish(@Body() dto: PublishDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.n8NService.publish(dto);
  }
}
