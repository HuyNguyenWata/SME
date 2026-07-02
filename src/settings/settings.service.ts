import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/PrismaService/prisma.service';
import { SettingDto } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  upsert(dto: SettingDto) {
    return this.prisma.setting.upsert({
      where: { key: dto.key },
      create: dto,
      update: { value: dto.value, description: dto.description },
    });
  }

  async remove(key: string) {
    await this.prisma.setting.delete({ where: { key } });
    return { key };
  }
}
