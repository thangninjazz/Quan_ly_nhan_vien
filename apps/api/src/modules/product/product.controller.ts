import { Controller, Post, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('product-types')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @RequirePermission('product.manage')
  async create(@TenantId() tenantId: string, @Body() body: any) {
    return this.productService.createProductType(tenantId, body);
  }

  @Get()
  async findAll(@TenantId() tenantId: string) {
    return this.productService.getProductTypes(tenantId);
  }

  @Patch(':id')
  @RequirePermission('product.manage')
  async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.productService.updateProductType(tenantId, id, body);
  }
}
