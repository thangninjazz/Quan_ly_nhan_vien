import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AllowanceService {
  constructor(private prisma: PrismaService) {}

  async addAllowance(
    tenantId: string,
    employeeId: string,
    data: { name: string; amountVnd: number; effectiveFrom: Date; effectiveTo: Date | null },
  ) {
    // Verify employee belongs to tenant
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId: tenantId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const prisma = this.prisma as any;
    return prisma.employeeAllowance.create({
      data: {
        companyId: tenantId,
        employeeId,
        name: data.name,
        amountVnd: data.amountVnd,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
      },
    });
  }

  async getEmployeeAllowances(tenantId: string, employeeId: string) {
    const prisma = this.prisma as any;
    return prisma.employeeAllowance.findMany({
      where: { companyId: tenantId, employeeId },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updateAllowance(
    tenantId: string,
    employeeId: string,
    allowanceId: string,
    data: Partial<{ name: string; amountVnd: number; effectiveFrom: Date; effectiveTo: Date | null }>,
  ) {
    const prisma = this.prisma as any;
    const allowance = await prisma.employeeAllowance.findFirst({
      where: { id: allowanceId, companyId: tenantId, employeeId },
    });
    if (!allowance) throw new NotFoundException('Allowance not found');

    return prisma.employeeAllowance.update({
      where: { id: allowanceId },
      data: {
        name: data.name,
        amountVnd: data.amountVnd,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
      },
    });
  }
}
