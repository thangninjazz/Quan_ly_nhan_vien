import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductService } from './product.service';

@Controller('piece-rates')
@UseGuards(JwtAuthGuard)
export class PieceRateController {
  constructor(private productService: ProductService) {}

  @Get()
  @RequirePermission('rate.manage')
  async list(@TenantId() tenantId: string, @Query('productTypeId') productTypeId?: string) {
    return this.productService.listPieceRates(tenantId, { productTypeId });
  }

  @Post()
  @RequirePermission('rate.manage')
  async create(
    @TenantId() tenantId: string,
    @Body() body: { productTypeId: string; rateVnd: number; effectiveFrom: string },
  ) {
    return this.productService.addPieceRate(tenantId, body.productTypeId, {
      rateVnd: body.rateVnd,
      effectiveFrom: new Date(body.effectiveFrom),
    });
  }
}
