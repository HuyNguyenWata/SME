import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { parseId } from '../common/utils/id.util';
import { PromptTemplateDto } from './dto/prompt-template.dto';
import { PromptsService } from './prompts.service';

@ApiTags('Prompts')
@Controller('prompts')
export class PromptsController {
  constructor(private readonly prompts: PromptsService) {}

  @Get()
  findAll() {
    return this.prompts.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  create(@Body() dto: PromptTemplateDto) {
    return this.prompts.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: PromptTemplateDto) {
    return this.prompts.update(parseId(id), dto);
  }

  @Post(':id/render')
  render(@Param('id') id: string, @Body() variables: Record<string, string>) {
    return this.prompts.render(parseId(id), variables);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.prompts.remove(parseId(id));
  }
}
