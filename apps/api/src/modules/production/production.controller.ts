import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('production-entries')
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Post()
  @RequirePermission('production.submit')
  async createDraft(@TenantId() tenantId: string, @Request() req: any, @Body() body: any) {
    return this.productionService.createDraft(tenantId, req.user.userId, {
      productTypeId: body.productTypeId,
      quantity: body.quantity,
      workDate: new Date(body.workDate),
      evidenceUrl: body.evidenceUrl,
      note: body.note,
    });
  }

  @Post(':id/submit')
  @RequirePermission('production.submit')
  async submit(@TenantId() tenantId: string, @Param('id') id: string, @Request() req: any) {
    return this.productionService.submitDraft(tenantId, id, req.user.userId);
  }

  @Post(':id/approve')
  @RequirePermission('production.approve')
  async approve(@TenantId() tenantId: string, @Param('id') id: string, @Request() req: any) {
    return this.productionService.approveEntry(tenantId, id, req.user.userId);
  }

  @Post(':id/reject')
  @RequirePermission('production.approve')
  async reject(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { reason?: string },
  ) {
    return this.productionService.rejectEntry(tenantId, id, req.user.userId, body.reason ?? null);
  }

  @Get()
  @RequirePermission('production.approve')
  async list(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.productionService.listEntries(tenantId, {
      status: status as any,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      employeeId,
    });
  }

  @Get('me')
  @RequirePermission('production.submit')
  async myEntries(@TenantId() tenantId: string, @Request() req: any) {
    return this.productionService.getMyEntries(tenantId, req.user.userId);
  }
}
