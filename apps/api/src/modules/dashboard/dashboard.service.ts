import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollStatus } from '@hr-saas/shared';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboard(tenantId: string) {
    const prisma = this.prisma as any;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [employeesCount, productTypesCount, pendingApprovalsCount, currentRun, lastLocked] = await Promise.all([
      prisma.employee.count({ where: { companyId: tenantId, isActive: true } }),
      prisma.productType.count({ where: { companyId: tenantId, isActive: true } }),
      prisma.productionEntry.count({ where: { companyId: tenantId, status: 'SUBMITTED' } }),
      prisma.payrollRun.findUnique({
        where: { companyId_year_month: { companyId: tenantId, year, month } },
        select: { id: true, status: true, calculatedAt: true, lockedAt: true, totalAmount: true },
      }),
      prisma.payrollRun.findFirst({
        where: { companyId: tenantId, status: PayrollStatus.LOCKED },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        select: { id: true, year: true, month: true, totalAmount: true, lockedAt: true },
      }),
    ]);

    return {
      employeesCount,
      productTypesCount,
      pendingApprovalsCount,
      payroll: {
        currentPeriod: { year, month },
        currentRun,
        lastLocked,
      },
    };
  }
}

