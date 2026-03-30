import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AllowanceService } from './allowance.service';

@Controller('employees/:employeeId/allowances')
@UseGuards(JwtAuthGuard)
@RequirePermission('employee.allowance.manage')
export class AllowanceController {
  constructor(private allowanceService: AllowanceService) {}

  @Get()
  async list(@TenantId() tenantId: string, @Param('employeeId') employeeId: string) {
    return this.allowanceService.getEmployeeAllowances(tenantId, employeeId);
  }

  @Post()
  async create(
    @TenantId() tenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { name: string; amountVnd: number; effectiveFrom: string; effectiveTo?: string | null },
  ) {
    return this.allowanceService.addAllowance(tenantId, employeeId, {
      name: body.name,
      amountVnd: body.amountVnd,
      effectiveFrom: new Date(body.effectiveFrom),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
    });
  }

  @Patch(':id')
  async update(
    @TenantId() tenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; amountVnd: number; effectiveFrom: string; effectiveTo: string | null }>,
  ) {
    return this.allowanceService.updateAllowance(tenantId, employeeId, id, {
      name: body.name,
      amountVnd: body.amountVnd,
      effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : undefined,
      effectiveTo: body.effectiveTo === undefined ? undefined : body.effectiveTo ? new Date(body.effectiveTo) : null,
    });
  }
}
