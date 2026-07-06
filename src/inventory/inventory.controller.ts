import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { InventoryTransactionDto } from './dto/inventory-transaction.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('history')
  @ApiOperation({ summary: 'List inventory history' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.inventory.findAll(query);
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
}
