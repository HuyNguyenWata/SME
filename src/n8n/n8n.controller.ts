import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { N8NService } from './n8n.service';

interface AuthRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}
import { ContentDto, PublishDto } from './dto/n8n.request.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('n8n')
export class N8NController {
  constructor(private readonly n8NService: N8NService) {}

  @Post('facebook')
  async publish(@Body() dto: PublishDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.n8NService.publish(dto);
  }

  @Post('content')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async content(@Body() dto: ContentDto, @Req() req: AuthRequest) {
    return this.n8NService.createContent(dto, req.user.id);
  }

  @Post('instant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async instantSubmit(@Req() req: AuthRequest) {
    console.log(req.user);
    return this.n8NService.instantSubmit({
      userId: req.user.id,
    });
  }
}
