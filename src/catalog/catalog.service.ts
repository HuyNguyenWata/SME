import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  createCategory(dto: CategoryDto) {
    return this.prisma.category.create({ data: { name: dto.name } });
  }

  async updateCategory(id: number, dto: CategoryDto) {
    await this.ensureCategory(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async removeCategory(id: number) {
    await this.ensureCategory(id);
    await this.prisma.category.delete({ where: { id } });
    return { id };
  }

  rssSources() {
    return this.prisma.rSSSource.findMany({ include: { category: true } });
  }

  private async ensureCategory(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
  }
}
