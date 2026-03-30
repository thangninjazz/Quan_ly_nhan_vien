import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Auth + Tenant + Permissions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let tenantId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

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

    for (const code of permissionCodes) {
      await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code },
      });
    }

    const company = await prisma.company.upsert({
      where: { subdomain: 'e2e-demo' },
      update: { name: 'E2E Demo' },
      create: { name: 'E2E Demo', subdomain: 'e2e-demo' },
    });
    tenantId = company.id;

    const branch = await prisma.branch.upsert({
      where: { id: `${company.id}-e2e-branch` },
      update: { name: 'E2E Branch', companyId: company.id },
      create: { id: `${company.id}-e2e-branch`, companyId: company.id, name: 'E2E Branch' },
    });

    const adminEmployee = await prisma.employee.upsert({
      where: { id: `${company.id}-e2e-emp-admin` },
      update: { fullName: 'E2E Admin', companyId: company.id, branchId: branch.id },
      create: {
        id: `${company.id}-e2e-emp-admin`,
        fullName: 'E2E Admin',
        companyId: company.id,
        branchId: branch.id,
        code: 'E2E-A',
      },
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.upsert({
      where: { username: 'e2e_admin' },
      update: { passwordHash, employeeId: adminEmployee.id },
      create: { username: 'e2e_admin', passwordHash, employeeId: adminEmployee.id },
    });

    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: 'Admin' } },
      update: {},
      create: { companyId: company.id, name: 'Admin' },
    });

    const allPerms = await prisma.permission.findMany({ where: { code: { in: permissionCodes } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: allPerms.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });

    await prisma.userRole.deleteMany({ where: { userId: adminUser.id } });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: role.id } });

    // Ensure base roles exist so we can create employees with them in tests
    const employeeRole = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: 'Employee' } },
      update: {},
      create: { companyId: company.id, name: 'Employee' },
    });
    const managerRole = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: 'Manager' } },
      update: {},
      create: { companyId: company.id, name: 'Manager' },
    });

    const permIdByCode = new Map(allPerms.map((p) => [p.code, p.id]));
    await prisma.rolePermission.deleteMany({ where: { roleId: employeeRole.id } });
    await prisma.rolePermission.createMany({
      data: ['production.submit', 'payslip.view_self'].map((code) => ({
        roleId: employeeRole.id,
        permissionId: permIdByCode.get(code)!,
      })),
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: managerRole.id } });
    await prisma.rolePermission.createMany({
      data: ['production.approve'].map((code) => ({
        roleId: managerRole.id,
        permissionId: permIdByCode.get(code)!,
      })),
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('requires X-Tenant-Id + valid JWT for business routes', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Tenant-Id', tenantId)
      .send({ username: 'e2e_admin', password: 'password123' })
      .expect(201);

    const token = loginRes.body?.access_token as string;
    expect(typeof token).toBe('string');

    await request(app.getHttpServer())
      .post('/product-types')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Product', unit: 'pcs' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/product-types')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', tenantId)
      .send({ name: `E2E Product ${Date.now()}`, unit: 'pcs' })
      .expect(201);
  });

  it('can create employee (employee + user + role)', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Tenant-Id', tenantId)
      .send({ username: 'e2e_admin', password: 'password123' })
      .expect(201);

    const token = loginRes.body?.access_token as string;

    const username = `e2e_worker_${Date.now()}`;

    const created = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', tenantId)
      .send({ fullName: 'E2E Worker', username, roleName: 'Employee' })
      .expect(201);

    expect(created.body?.employee?.fullName).toBe('E2E Worker');
    expect(created.body?.user?.username).toBe(username);
    expect(typeof created.body?.tempPassword).toBe('string');
  });
});
