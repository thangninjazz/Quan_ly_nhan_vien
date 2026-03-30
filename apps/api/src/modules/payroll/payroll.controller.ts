import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Post('payroll-runs')
  @RequirePermission('payroll.run')
  async createRun(@TenantId() tenantId: string, @Body() body: { month: number; year: number }) {
    return this.payrollService.createPayrollRun(tenantId, body.month, body.year);
  }

  @Get('payroll-runs')
  @RequirePermission('payroll.run')
  async listRuns(@TenantId() tenantId: string) {
    return this.payrollService.listPayrollRuns(tenantId);
  }

  @Post('payroll-runs/:id/calculate')
  @RequirePermission('payroll.run')
  async calculate(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.payrollService.calculatePayrollRun(tenantId, id);
  }

  @Post('payroll-runs/:id/lock')
  @RequirePermission('payroll.lock')
  async lock(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.payrollService.lockPayroll(tenantId, id);
  }

  @Get('payroll-runs/:id/lines')
  @RequirePermission('payroll.run')
  async lines(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.payrollService.getPayrollLines(tenantId, id);
  }

  @Post('payroll-runs/:runId/lines/:lineId')
  @RequirePermission('payroll.run')
  async updateLine(
    @TenantId() tenantId: string,
    @Param('runId') runId: string,
    @Param('lineId') lineId: string,
    @Body() body: { allowancePay: number },
  ) {
    return this.payrollService.updatePayrollLine(tenantId, runId, lineId, body.allowancePay);
  }

  @Get('me/payslips')
  @RequirePermission('payslip.view_self')
  async myPayslip(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.payrollService.getMyPayslip(tenantId, req.user.userId, {
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
    });
  }

  @Get('me/payslips/history')
  @RequirePermission('payslip.view_self')
  async myHistory(@TenantId() tenantId: string, @Request() req: any) {
    return this.payrollService.getMyPayslipHistory(tenantId, req.user.userId);
  }
}
