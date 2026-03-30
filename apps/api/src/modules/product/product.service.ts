import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollStatus } from '@hr-saas/shared';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createProductType(tenantId: string, data: { name: string; unit?: string }) {
    const prisma = this.prisma as any;
    return prisma.productType.create({
      data: {
        ...data,
        companyId: tenantId,
      },
    });
  }

  async getProductTypes(tenantId: string) {
    const prisma = this.prisma as any;
    return prisma.productType.findMany({
      where: { companyId: tenantId, isActive: true },
      include: { rates: { orderBy: { effectiveFrom: 'desc' }, take: 1 } },
    });
  }

  async updateProductType(tenantId: string, productTypeId: string, data: { name?: string; unit?: string; isActive?: boolean }) {
    const prisma = this.prisma as any;
    const existing = await prisma.productType.findFirst({
      where: { id: productTypeId, companyId: tenantId },
    });
    if (!existing) throw new NotFoundException('Product type not found');

    return prisma.productType.update({
      where: { id: productTypeId },
      data: {
        name: data.name,
        unit: data.unit,
        isActive: data.isActive,
      },
    });
  }

  async addPieceRate(tenantId: string, productTypeId: string, data: { rateVnd: number; effectiveFrom: Date }) {
    // Verify product belongs to tenant
    const prisma = this.prisma as any;
    const product = await prisma.productType.findFirst({
      where: { id: productTypeId, companyId: tenantId },
    });
    if (!product) throw new NotFoundException('Product type not found');

    const effYear = data.effectiveFrom.getUTCFullYear();
    const effMonth = data.effectiveFrom.getUTCMonth() + 1;
    const lockedRun = await prisma.payrollRun.findFirst({
      where: {
        companyId: tenantId,
        status: PayrollStatus.LOCKED,
        OR: [
          { year: { gt: effYear } },
          { year: effYear, month: { gte: effMonth } },
        ],
      },
      select: { id: true },
    });
    if (lockedRun) {
      throw new BadRequestException('Cannot add piece rate: there is a locked payroll run that would be affected');
    }

    return prisma.pieceRate.create({
      data: {
        companyId: tenantId,
        rateVnd: data.rateVnd,
        effectiveFrom: data.effectiveFrom,
        productTypeId,
      },
    });
  }

  async listPieceRates(tenantId: string, filters: { productTypeId?: string }) {
    const prisma = this.prisma as any;
    return prisma.pieceRate.findMany({
      where: {
        companyId: tenantId,
        ...(filters.productTypeId ? { productTypeId: filters.productTypeId } : {}),
      },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getRateForDate(tenantId: string, productTypeId: string, date: Date) {
    const prisma = this.prisma as any;
    return prisma.pieceRate.findFirst({
      where: {
        companyId: tenantId,
        productTypeId,
        effectiveFrom: { lte: date },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}
