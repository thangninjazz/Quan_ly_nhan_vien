import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function ensurePermissions(codes: string[]) {
  for (const code of codes) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
}

async function main() {
  const permissionCodes = [
    'product.manage',
    'rate.manage',
    'production.submit',
    'production.approve',
    'employee.allowance.manage',
    'payroll.run',
    'payroll.lock',
    'payslip.view_self',
  ];
  await ensurePermissions(permissionCodes);

  const company = await (prisma as any).company.upsert({
    where: { code: 'DEMO' },
    update: { name: 'Demo Company', subdomain: 'demo' },
    create: { name: 'Demo Company', code: 'DEMO', subdomain: 'demo' },
  });

  const branch = await prisma.branch.upsert({
    where: { id: `${company.id}-main-branch` },
    update: { name: 'Main Branch', companyId: company.id },
    create: { id: `${company.id}-main-branch`, companyId: company.id, name: 'Main Branch' },
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { id: `${company.id}-emp-admin` },
    update: { fullName: 'Admin', companyId: company.id, branchId: branch.id },
    create: { id: `${company.id}-emp-admin`, fullName: 'Admin', companyId: company.id, branchId: branch.id, code: 'A001' },
  });
  const managerEmployee = await prisma.employee.upsert({
    where: { id: `${company.id}-emp-manager` },
    update: { fullName: 'Manager', companyId: company.id, branchId: branch.id },
    create: { id: `${company.id}-emp-manager`, fullName: 'Manager', companyId: company.id, branchId: branch.id, code: 'M001' },
  });
  const workerEmployee = await prisma.employee.upsert({
    where: { id: `${company.id}-emp-worker` },
    update: { fullName: 'Employee', companyId: company.id, branchId: branch.id },
    create: { id: `${company.id}-emp-worker`, fullName: 'Employee', companyId: company.id, branchId: branch.id, code: 'E001' },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash, employeeId: adminEmployee.id },
    create: { username: 'admin', passwordHash, employeeId: adminEmployee.id },
  });
  const managerUser = await prisma.user.upsert({
    where: { username: 'manager' },
    update: { passwordHash, employeeId: managerEmployee.id },
    create: { username: 'manager', passwordHash, employeeId: managerEmployee.id },
  });
  const workerUser = await prisma.user.upsert({
    where: { username: 'employee' },
    update: { passwordHash, employeeId: workerEmployee.id },
    create: { username: 'employee', passwordHash, employeeId: workerEmployee.id },
  });

  const allPermissions = await prisma.permission.findMany({ where: { code: { in: permissionCodes } } });
  const permIdByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  const adminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Admin' } },
    update: {},
    create: { companyId: company.id, name: 'Admin' },
  });
  const managerRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Manager' } },
    update: {},
    create: { companyId: company.id, name: 'Manager' },
  });
  const employeeRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Employee' } },
    update: {},
    create: { companyId: company.id, name: 'Employee' },
  });

  async function setRolePermissions(roleId: string, codes: string[]) {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    await prisma.rolePermission.createMany({
      data: codes.map((code) => ({ roleId, permissionId: permIdByCode.get(code)! })),
    });
  }

  await setRolePermissions(adminRole.id, permissionCodes);
  await setRolePermissions(managerRole.id, ['production.approve']);
  await setRolePermissions(employeeRole.id, ['production.submit', 'payslip.view_self']);

  await prisma.userRole.deleteMany({ where: { userId: { in: [adminUser.id, managerUser.id, workerUser.id] } } });
  await prisma.userRole.createMany({
    data: [
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: managerUser.id, roleId: managerRole.id },
      { userId: workerUser.id, roleId: employeeRole.id },
    ],
  });

  // Demo data: one product + rate versions
  const product = await prisma.productType.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Product A' } },
    update: { isActive: true },
    create: { companyId: company.id, name: 'Product A', unit: 'pcs' },
  });

  // For SQLite, we use individual creates because createMany skipDuplicates is not supported
  try {
    await prisma.pieceRate.create({
      data: { companyId: company.id, productTypeId: product.id, rateVnd: 10_000, effectiveFrom: new Date('2026-03-01') },
    });
    await prisma.pieceRate.create({
      data: { companyId: company.id, productTypeId: product.id, rateVnd: 12_000, effectiveFrom: new Date('2026-03-15') },
    });
  } catch (e) {
    // Ignore duplicates if they exist
  }

  // Demo allowance
  await prisma.employeeAllowance.upsert({
    where: { id: `${company.id}-allowance-worker-1` },
    update: {
      name: 'Chuyên cần',
      amountVnd: 200_000,
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: null,
    },
    create: {
      id: `${company.id}-allowance-worker-1`,
      companyId: company.id,
      employeeId: workerEmployee.id,
      name: 'Chuyên cần',
      amountVnd: 200_000,
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: null,
    },
  });

  // Demo production entries (one approved + one rejected) in current month
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const d1 = new Date(`${y}-${pad2(m)}-10`);
  const d2 = new Date(`${y}-${pad2(m)}-20`);

  await prisma.productionEntry.upsert({
    where: { id: `${company.id}-prod-approved-1` },
    update: {
      companyId: company.id,
      employeeId: workerEmployee.id,
      productTypeId: product.id,
      quantity: 10,
      workDate: d1,
      status: 'APPROVED',
      submittedAt: d1,
      approvedBy: managerUser.id,
      approvedAt: d1,
      rejectReason: null,
    },
    create: {
      id: `${company.id}-prod-approved-1`,
      companyId: company.id,
      employeeId: workerEmployee.id,
      productTypeId: product.id,
      quantity: 10,
      workDate: d1,
      status: 'APPROVED',
      submittedAt: d1,
      approvedBy: managerUser.id,
      approvedAt: d1,
    },
  });

  await prisma.productionEntry.upsert({
    where: { id: `${company.id}-prod-rejected-1` },
    update: {
      companyId: company.id,
      employeeId: workerEmployee.id,
      productTypeId: product.id,
      quantity: 5,
      workDate: d2,
      status: 'REJECTED',
      submittedAt: d2,
      approvedBy: managerUser.id,
      approvedAt: d2,
      rejectReason: 'Ảnh minh chứng chưa rõ, vui lòng chụp lại',
    },
    create: {
      id: `${company.id}-prod-rejected-1`,
      companyId: company.id,
      employeeId: workerEmployee.id,
      productTypeId: product.id,
      quantity: 5,
      workDate: d2,
      status: 'REJECTED',
      submittedAt: d2,
      approvedBy: managerUser.id,
      approvedAt: d2,
      rejectReason: 'Ảnh minh chứng chưa rõ, vui lòng chụp lại',
    },
  });

  console.log('Seed complete');
  await (prisma as any).user.upsert({
    where: { username: 'superadmin' },
    update: { passwordHash, isSuperAdmin: true, employeeId: null },
    create: { username: 'superadmin', passwordHash, isSuperAdmin: true, employeeId: null },
  });

  console.log('Seed complete');
  console.log('Demo company code (X-Tenant-Id):', company.code);
  console.log('Users: admin / manager / employee (password: password123)');
  console.log('Platform user: superadmin (password: password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
