import { PartialType } from '@nestjs/swagger';
import { CreateNewsApiConfigDto } from './create-news-api-config.dto';

export class UpdateNewsApiConfigDto extends PartialType(
  CreateNewsApiConfigDto,
) {}
