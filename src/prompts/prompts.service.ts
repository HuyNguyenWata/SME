import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { PromptTemplateDto } from './dto/prompt-template.dto';

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.promptTemplate.findMany({ orderBy: { id: 'asc' } });
  }

  create(dto: PromptTemplateDto) {
    return this.prisma.promptTemplate.create({ data: dto });
  }

  async update(id: number, dto: PromptTemplateDto) {
    await this.ensure(id);
    return this.prisma.promptTemplate.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.ensure(id);
    await this.prisma.promptTemplate.delete({ where: { id } });
    return { id };
  }

  render(id: number, variables: Record<string, string>) {
    return this.prisma.promptTemplate
      .findUnique({ where: { id } })
      .then((prompt) => {
        if (!prompt) throw new NotFoundException('Prompt not found');
        let rendered = prompt.prompt;
        for (const [key, value] of Object.entries(variables)) {
          rendered = rendered.replaceAll(`{{${key}}}`, value);
        }
        return { rendered };
      });
  }

  private async ensure(id: number) {
    const prompt = await this.prisma.promptTemplate.findUnique({
      where: { id },
    });
    if (!prompt) throw new NotFoundException('Prompt not found');
  }
}
