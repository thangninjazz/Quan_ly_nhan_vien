import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntryStatus, PayrollStatus } from '@hr-saas/shared';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  private async assertNotLockedForDate(tenantId: string, workDate: Date) {
    const year = workDate.getUTCFullYear();
    const month = workDate.getUTCMonth() + 1;
    const prisma = this.prisma as any;
    const locked = await prisma.payrollRun.findFirst({
      where: { companyId: tenantId, year, month, status: PayrollStatus.LOCKED as any },
      select: { id: true },
    });
    if (locked) throw new BadRequestException('Payroll for this period is locked');
  }

  private async getEmployeeIdForUser(tenantId: string, userId: string) {
    const prisma = this.prisma as any;
    const user = await prisma.user.findFirst({
      where: { id: userId, employee: { companyId: tenantId } },
      include: { employee: true },
    });
    if (!user || !user.employee) throw new NotFoundException('Employee not found');
    return user.employeeId;
  }

  async createDraft(
    tenantId: string,
    userId: string,
    data: {
      productTypeId: string;
      quantity: number;
      workDate: Date;
      evidenceUrl?: string;
      note?: string;
    },
  ) {
    await this.assertNotLockedForDate(tenantId, data.workDate);
    const employeeId = await this.getEmployeeIdForUser(tenantId, userId);

    const prisma = this.prisma as any;
    const existing = await prisma.productionEntry.findFirst({
      where: {
        companyId: tenantId,
        employeeId,
        productTypeId: data.productTypeId,
        workDate: data.workDate,
      },
    });

    if (!existing) {
      return prisma.productionEntry.create({
        data: {
          companyId: tenantId,
          employeeId,
          productTypeId: data.productTypeId,
          quantity: data.quantity,
          workDate: data.workDate,
          evidenceUrl: data.evidenceUrl,
          note: data.note,
          status: EntryStatus.DRAFT,
        },
      });
    }

    if (existing.status === EntryStatus.APPROVED) {
      throw new BadRequestException('Approved entry cannot be modified');
    }

    return prisma.productionEntry.update({
      where: { id: existing.id },
      data: {
        quantity: data.quantity,
        evidenceUrl: data.evidenceUrl,
        note: data.note,
        status: EntryStatus.DRAFT,
        submittedAt: null,
        approvedBy: null,
        approvedAt: null,
        rejectReason: null,
      },
    });
  }

  async submitDraft(tenantId: string, entryId: string, userId: string) {
    const employeeId = await this.getEmployeeIdForUser(tenantId, userId);
    const prisma = this.prisma as any;
    const entry = await prisma.productionEntry.findFirst({
      where: { id: entryId, companyId: tenantId, employeeId },
    });
    if (!entry) throw new NotFoundException('Entry not found');

    await this.assertNotLockedForDate(tenantId, entry.workDate);

    if (entry.status !== EntryStatus.DRAFT && entry.status !== EntryStatus.REJECTED) {
      throw new BadRequestException('Only draft/rejected entries can be submitted');
    }

    return prisma.productionEntry.update({
      where: { id: entryId },
      data: {
        status: EntryStatus.SUBMITTED,
        submittedAt: new Date(),
        rejectReason: null,
      },
    });
  }

  async approveEntry(tenantId: string, entryId: string, managerId: string) {
    const prisma = this.prisma as any;
    const entry = await prisma.productionEntry.findFirst({
      where: { id: entryId, companyId: tenantId },
    });
    if (!entry) throw new NotFoundException('Entry not found');

    await this.assertNotLockedForDate(tenantId, entry.workDate);

    if (entry.status !== EntryStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted entries can be approved');
    }

    return prisma.productionEntry.update({
      where: { id: entryId },
      data: {
        status: EntryStatus.APPROVED,
        approvedBy: managerId,
        approvedAt: new Date(),
        rejectReason: null,
      },
    });
  }

  async rejectEntry(tenantId: string, entryId: string, managerId: string, reason: string | null) {
    const prisma = this.prisma as any;
    const entry = await prisma.productionEntry.findFirst({
      where: { id: entryId, companyId: tenantId },
    });
    if (!entry) throw new NotFoundException('Entry not found');

    await this.assertNotLockedForDate(tenantId, entry.workDate);

    if (entry.status !== EntryStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted entries can be rejected');
    }

    return prisma.productionEntry.update({
      where: { id: entryId },
      data: {
        status: EntryStatus.REJECTED,
        approvedBy: managerId,
        approvedAt: new Date(),
        rejectReason: reason,
      },
    });
  }

  async listEntries(
    tenantId: string,
    filters: { status?: EntryStatus; from?: Date; to?: Date; employeeId?: string },
  ) {
    const prisma = this.prisma as any;
    return prisma.productionEntry.findMany({
      where: {
        companyId: tenantId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.from || filters.to
          ? {
              workDate: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      include: { employee: true, productType: true },
      orderBy: [{ workDate: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async getEmployeeEntries(tenantId: string, employeeId: string) {
    const prisma = this.prisma as any;
    return prisma.productionEntry.findMany({
      where: { companyId: tenantId, employeeId },
      include: { productType: true },
      orderBy: { workDate: 'desc' },
    });
  }

  async getMyEntries(tenantId: string, userId: string) {
    const employeeId = await this.getEmployeeIdForUser(tenantId, userId);
    return this.getEmployeeEntries(tenantId, employeeId);
  }
}
