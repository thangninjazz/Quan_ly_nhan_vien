import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntryStatus, PayrollStatus } from '@hr-saas/shared';
import { calculatePayroll } from './payroll-engine';

type EmployeeRow = { id: string; fullName: string; code: string | null };
type ApprovedEntryRow = {
  id: string;
  employeeId: string;
  productTypeId: string;
  quantity: number;
  workDate: Date;
};
type AllowanceRow = {
  id: string;
  employeeId: string;
  name: string;
  amountVnd: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

function periodStartUtc(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

function nextPeriodStartUtc(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1));
}

function periodEndUtc(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0));
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async createPayrollRun(tenantId: string, month: number, year: number) {
    if (month < 1 || month > 12) throw new BadRequestException('Invalid month');
    if (year < 2000 || year > 3000) throw new BadRequestException('Invalid year');

    const prisma = this.prisma as any;
    const existing = await prisma.payrollRun.findUnique({
      where: { companyId_year_month: { companyId: tenantId, year, month } },
    });
    if (existing) return existing;

    return prisma.payrollRun.create({
      data: { companyId: tenantId, month, year, status: PayrollStatus.DRAFT },
    });
  }

  async listPayrollRuns(tenantId: string) {
    const prisma = this.prisma as any;
    return prisma.payrollRun.findMany({
      where: { companyId: tenantId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async calculatePayrollRun(tenantId: string, runId: string) {
    const prisma = this.prisma as any;
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, companyId: tenantId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status === PayrollStatus.LOCKED) throw new BadRequestException('Payroll run is locked');

    const start = periodStartUtc(run.year, run.month);
    const endExclusive = nextPeriodStartUtc(run.year, run.month);
    const endInclusive = periodEndUtc(run.year, run.month);

    const [employees, entries, allowances] = (await Promise.all([
      prisma.employee.findMany({
        where: { companyId: tenantId, isActive: true },
        select: { id: true, fullName: true, code: true },
      }),
      prisma.productionEntry.findMany({
        where: {
          companyId: tenantId,
          status: EntryStatus.APPROVED as any,
          workDate: { gte: start, lt: endExclusive },
        },
        select: {
          id: true,
          employeeId: true,
          productTypeId: true,
          quantity: true,
          workDate: true,
        },
      }),
      prisma.employeeAllowance.findMany({
        where: {
          companyId: tenantId,
          effectiveFrom: { lte: endInclusive },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
        },
        select: {
          id: true,
          employeeId: true,
          name: true,
          amountVnd: true,
          effectiveFrom: true,
          effectiveTo: true,
        },
      }),
    ])) as [EmployeeRow[], ApprovedEntryRow[], AllowanceRow[]];

    const productTypeIds = Array.from(new Set(entries.map((e) => e.productTypeId)));
    const rates = productTypeIds.length
      ? await prisma.pieceRate.findMany({
          where: {
            companyId: tenantId,
            productTypeId: { in: productTypeIds },
            effectiveFrom: { lte: endInclusive },
          },
          select: { productTypeId: true, effectiveFrom: true, rateVnd: true },
          orderBy: [{ productTypeId: 'asc' }, { effectiveFrom: 'asc' }],
        })
      : [];

    const result = calculatePayroll({
      employees: employees.map((e) => e.id),
      approvedEntries: entries,
      pieceRates: rates,
      allowances,
    });

    if (result.missingRates.length) {
      throw new BadRequestException({
        message: 'Missing piece rates for some entries',
        missingRates: result.missingRates,
      });
    }

    const now = new Date();
    const totalAmount = result.lines.reduce((acc, l) => acc + l.totalPay, 0);

    await prisma.$transaction(async (tx: any) => {
      await tx.payrollLineItem.deleteMany({ where: { companyId: tenantId, payrollLine: { payrollRunId: run.id } } });
      await tx.payrollLine.deleteMany({ where: { companyId: tenantId, payrollRunId: run.id } });

      for (const line of result.lines) {
        const created = await tx.payrollLine.create({
          data: {
            companyId: tenantId,
            payrollRunId: run.id,
            employeeId: line.employeeId,
            productionPay: line.productionPay,
            allowancePay: line.allowancePay,
            totalPay: line.totalPay,
            metadata: {
              allowancesApplied: line.allowancesApplied,
            },
          },
        });

        if (line.items.length) {
          await tx.payrollLineItem.createMany({
            data: line.items.map((it) => ({
              companyId: tenantId,
              payrollLineId: created.id,
              productTypeId: it.productTypeId,
              quantityTotal: it.quantityTotal,
              rateEffectiveFrom: it.rateEffectiveFrom,
              rateVnd: it.rateVnd,
              amountVnd: it.amountVnd,
            })),
          });
        }
      }

      await tx.payrollRun.update({
        where: { id: run.id },
        data: {
          status: PayrollStatus.CALCULATED,
          totalAmount,
          calculatedAt: now,
        },
      });
    });

    return prisma.payrollRun.findUnique({ where: { id: run.id } });
  }

  async lockPayroll(tenantId: string, runId: string) {
    const prisma = this.prisma as any;
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, companyId: tenantId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status !== PayrollStatus.CALCULATED) {
      throw new BadRequestException('Only calculated payroll runs can be locked');
    }

    return prisma.payrollRun.update({
      where: { id: runId },
      data: { status: PayrollStatus.LOCKED, lockedAt: new Date() },
    });
  }

  async getPayrollLines(tenantId: string, runId: string) {
    const prisma = this.prisma as any;
    return prisma.payrollLine.findMany({
      where: { companyId: tenantId, payrollRunId: runId },
      include: {
        employee: { select: { id: true, fullName: true, code: true } },
        items: { include: { productType: { select: { id: true, name: true, unit: true } } } },
      },
      orderBy: [{ totalPay: 'desc' }, { employeeId: 'asc' }],
    });
  }

  async updatePayrollLine(tenantId: string, runId: string, lineId: string, allowancePay: number) {
    const prisma = this.prisma as any;
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, companyId: tenantId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status === PayrollStatus.LOCKED) {
      throw new BadRequestException('Cannot update locked payroll run');
    }

    const line = await prisma.payrollLine.findFirst({
      where: { id: lineId, payrollRunId: runId, companyId: tenantId },
    });
    if (!line) throw new NotFoundException('Payroll line not found');

    const totalPay = line.productionPay + allowancePay;

    const updated = await prisma.payrollLine.update({
      where: { id: lineId },
      data: { allowancePay, totalPay },
    });

    // Recalculate totalAmount for the run
    const allLines = await prisma.payrollLine.findMany({
      where: { payrollRunId: runId, companyId: tenantId },
      select: { totalPay: true },
    });
    const totalAmount = allLines.reduce((acc: number, l: any) => acc + l.totalPay, 0);

    await prisma.payrollRun.update({
      where: { id: runId },
      data: { totalAmount },
    });

    return updated;
  }

  async getMyPayslip(tenantId: string, userId: string, period: { year?: number; month?: number }) {
    if (!period.year || !period.month) throw new BadRequestException('year and month are required');

    const prisma = this.prisma as any;
    const user = await prisma.user.findFirst({
      where: { id: userId, employee: { companyId: tenantId } },
      include: { employee: true },
    });
    if (!user) throw new UnauthorizedException();

    const run = await prisma.payrollRun.findUnique({
      where: { companyId_year_month: { companyId: tenantId, year: period.year, month: period.month } },
    });
    if (!run) throw new NotFoundException('Payroll run not found');

    const line = await prisma.payrollLine.findFirst({
      where: { companyId: tenantId, payrollRunId: run.id, employeeId: user.employeeId },
      include: {
        payrollRun: true,
        items: { include: { productType: { select: { id: true, name: true, unit: true } } } },
      },
    });
    if (!line) throw new NotFoundException('Payslip not found');
    return line;
  }

  async getMyPayslipHistory(tenantId: string, userId: string) {
    const prisma = this.prisma as any;
    const user = await prisma.user.findFirst({
      where: { id: userId, employee: { companyId: tenantId } },
      include: { employee: true },
    });
    if (!user) throw new UnauthorizedException();

    return prisma.payrollLine.findMany({
      where: { companyId: tenantId, employeeId: user.employeeId },
      include: { payrollRun: true },
      orderBy: [{ payrollRun: { year: 'desc' } }, { payrollRun: { month: 'desc' } }],
    });
  }
}
