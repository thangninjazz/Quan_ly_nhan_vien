import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const BASE_PERMISSION_CODES = [
  'product.manage',
  'rate.manage',
  'production.submit',
  'production.approve',
  'employee.allowance.manage',
  'payroll.run',
  'payroll.lock',
  'payslip.view_self',
] as const;

function normalizeCompanyCode(code: string) {
  return code.trim().toUpperCase();
}

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async listCompanies() {
    const prisma = this.prisma as any;
    const companies = await prisma.company.findMany({
      select: { id: true, code: true, name: true, createdAt: true, updatedAt: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    const ids = companies.map((c: any) => c.id);
    const [employeeCounts, productCounts] = await Promise.all([
      prisma.employee.groupBy({
        by: ['companyId'],
        where: { companyId: { in: ids } },
        _count: { _all: true },
      }),
      prisma.productType.groupBy({
        by: ['companyId'],
        where: { companyId: { in: ids } },
        _count: { _all: true },
      }),
    ]);

    const empCountByCompanyId = new Map(employeeCounts.map((r: any) => [r.companyId, r._count._all]));
    const prodCountByCompanyId = new Map(productCounts.map((r: any) => [r.companyId, r._count._all]));

    return companies.map((c: any) => ({
      ...c,
      employeesCount: empCountByCompanyId.get(c.id) ?? 0,
      productTypesCount: prodCountByCompanyId.get(c.id) ?? 0,
    }));
  }

  async createCompany(input: {
    code: string;
    name: string;
    adminUsername?: string;
    adminPassword?: string;
  }) {
    const prisma = this.prisma as any;
    const code = normalizeCompanyCode(input.code);
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      throw new BadRequestException('Company code must be 3-20 chars (A-Z, 0-9, _, -)');
    }

    const existing = await prisma.company.findFirst({ where: { code }, select: { id: true } });
    if (existing) throw new BadRequestException('Company code already exists');

    const adminUsername = (input.adminUsername?.trim() || `admin_${code.toLowerCase()}`).slice(0, 50);
    const existingUser = await prisma.user.findUnique({ where: { username: adminUsername }, select: { id: true } });
    if (existingUser) throw new BadRequestException('Admin username already exists');

    const adminPassword = input.adminPassword?.trim() || 'password123';
    if (adminPassword.length < 6) throw new BadRequestException('Admin password must be at least 6 characters');

    // Ensure base permission codes exist (global)
    for (const permCode of BASE_PERMISSION_CODES) {
      await prisma.permission.upsert({
        where: { code: permCode },
        update: {},
        create: { code: permCode },
      });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const created = await prisma.$transaction(async (tx: any) => {
      const company = await tx.company.create({
        data: { name: input.name, code, subdomain: code.toLowerCase() },
      });

      const branch = await tx.branch.create({
        data: { companyId: company.id, name: 'Main Branch' },
      });

      const adminEmployee = await tx.employee.create({
        data: { companyId: company.id, branchId: branch.id, fullName: 'Admin', code: 'A001' },
      });

      const user = await tx.user.create({
        data: { username: adminUsername, passwordHash, employeeId: adminEmployee.id, isSuperAdmin: false },
      });

      // Create roles for this company
      const adminRole = await tx.role.create({ data: { companyId: company.id, name: 'Admin' } });
      const managerRole = await tx.role.create({ data: { companyId: company.id, name: 'Manager' } });
      const employeeRole = await tx.role.create({ data: { companyId: company.id, name: 'Employee' } });

      const perms = await tx.permission.findMany({ where: { code: { in: BASE_PERMISSION_CODES } } });
      const permIdByCode = new Map(perms.map((p: any) => [p.code, p.id]));

      await tx.rolePermission.createMany({
        data: BASE_PERMISSION_CODES.map((permCode) => ({ roleId: adminRole.id, permissionId: permIdByCode.get(permCode)! })),
      });
      await tx.rolePermission.createMany({
        data: ['production.approve'].map((permCode) => ({ roleId: managerRole.id, permissionId: permIdByCode.get(permCode)! })),
      });
      await tx.rolePermission.createMany({
        data: ['production.submit', 'payslip.view_self'].map((permCode) => ({ roleId: employeeRole.id, permissionId: permIdByCode.get(permCode)! })),
      });

      await tx.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });

      return { company, adminUser: { id: user.id, username: user.username } };
    });

    return {
      ...created,
      adminTempPassword: adminPassword,
    };
  }

  async updateCompany(companyId: string, input: { code?: string; name?: string }) {
    const prisma = this.prisma as any;
    const existing = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!existing) throw new NotFoundException('Company not found');

    const data: any = {};
    if (typeof input.name === 'string' && input.name.trim()) data.name = input.name.trim();
    if (typeof input.code === 'string' && input.code.trim()) {
      const code = normalizeCompanyCode(input.code);
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
        throw new BadRequestException('Company code must be 3-20 chars (A-Z, 0-9, _, -)');
      }
      const dup = await prisma.company.findFirst({ where: { code, NOT: { id: companyId } }, select: { id: true } });
      if (dup) throw new BadRequestException('Company code already exists');
      data.code = code;
      data.subdomain = code.toLowerCase();
    }

    return prisma.company.update({ where: { id: companyId }, data });
  }

  async deleteCompany(companyId: string) {
    const prisma = this.prisma as any;
    const existing = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!existing) throw new NotFoundException('Company not found');

    await prisma.$transaction(async (tx: any) => {
      // Order matters (FK constraints)
      await tx.refreshToken.deleteMany({ where: { companyId: companyId } });

      await tx.userRole.deleteMany({ where: { role: { companyId: companyId } } });
      await tx.rolePermission.deleteMany({ where: { role: { companyId: companyId } } });

      await tx.employeeAllowance.deleteMany({ where: { companyId: companyId } });
      await tx.productionEntry.deleteMany({ where: { companyId: companyId } });
      await tx.payrollLineItem.deleteMany({ where: { companyId: companyId } });
      await tx.payrollLine.deleteMany({ where: { companyId: companyId } });
      await tx.payrollRun.deleteMany({ where: { companyId: companyId } });
      await tx.pieceRate.deleteMany({ where: { companyId: companyId } });
      await tx.productType.deleteMany({ where: { companyId: companyId } });

      // Users tied to employees of this company
      const employeeIds = (await tx.employee.findMany({
        where: { companyId: companyId },
        select: { id: true },
      })).map((e: any) => e.id);
      if (employeeIds.length) {
        await tx.userRole.deleteMany({ where: { user: { employeeId: { in: employeeIds } } } });
        await tx.refreshToken.deleteMany({ where: { user: { employeeId: { in: employeeIds } } } });
        await tx.user.deleteMany({ where: { employeeId: { in: employeeIds } } });
      }

      await tx.employee.deleteMany({ where: { companyId: companyId } });
      await tx.branch.deleteMany({ where: { companyId: companyId } });
      await tx.department.deleteMany({ where: { companyId: companyId } });
      await tx.role.deleteMany({ where: { companyId: companyId } });

      await tx.company.delete({ where: { id: companyId } });
    });

    return { ok: true };
  }
}

