import { BadRequestException } from '@nestjs/common';

export function parseId(id: string): number {
  const value = Number(id);
  if (!Number.isInteger(value) || value < 1) {
    throw new BadRequestException('Invalid numeric id');
  }
  return value;
}
