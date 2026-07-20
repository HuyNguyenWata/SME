import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { InventoryTransactionDto } from './dto/inventory-transaction.dto';
import { InventoryService } from './inventory.service';
import { InventoryHistoryQueryDto } from './dto/inventory-history-query.dto';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List inventory history' })
  findAll(
    @Query() query: InventoryHistoryQueryDto,
    @User('id') userId: number,
  ) {
    return this.inventory.findAll(query, userId);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import inventory' })
  import(@Body() dto: InventoryTransactionDto) {
    return this.inventory.import(dto);
  }

  @Post('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export inventory' })
  export(@Body() dto: InventoryTransactionDto) {
    return this.inventory.export(dto);
  }

  @Get('dead-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dead stock' })
  getDeadStock(@Query('thresholdDays') thresholdDays?: string) {
    const days = thresholdDays ? parseInt(thresholdDays, 10) : 60;
    return this.inventory.getDeadStock(days);
  }

  @Get('analytics/system')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system inventory analytics and revenue' })
  getSystemAnalytics(@Query('days') days: string, @User('id') userId: number) {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.inventory.getSystemAnalytics(userId, parsedDays);
  }
}
