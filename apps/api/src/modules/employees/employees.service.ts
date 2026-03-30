import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async listEmployees(tenantId: string) {
    const prisma = this.prisma as any;
    return prisma.employee.findMany({
      where: { companyId: tenantId, isActive: true },
      select: {
        id: true,
        fullName: true,
        code: true,
        joinedAt: true,
      },
      orderBy: [{ fullName: 'asc' }],
    });
  }

  async createEmployeeWithUser(
    tenantId: string,
    input: { fullName: string; code?: string; username: string; password: string; roleName: 'Employee' | 'Manager' | 'Admin' },
  ) {
    const prisma = this.prisma as any;

    const existingUsername = await prisma.user.findUnique({ where: { username: input.username } });
    if (existingUsername) throw new BadRequestException('Username already exists');

    const role = await prisma.role.findFirst({
      where: { companyId: tenantId, name: input.roleName },
      select: { id: true },
    });
    if (!role) throw new BadRequestException('Role not found');

    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await prisma.$transaction(async (tx: any) => {
      const employee = await tx.employee.create({
        data: {
          companyId: tenantId,
          fullName: input.fullName,
          code: input.code,
        },
        select: { id: true, fullName: true, code: true, joinedAt: true },
      });

      const user = await tx.user.create({
        data: {
          employeeId: employee.id,
          username: input.username,
          passwordHash,
        },
        select: { id: true, username: true },
      });

      await tx.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });

      return { employee, user };
    });

    return created;
  }
}
