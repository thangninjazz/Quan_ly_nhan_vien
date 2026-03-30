import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard)
@RequirePermission('employee.allowance.manage')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  async list(@TenantId() tenantId: string) {
    return this.employeesService.listEmployees(tenantId);
  }

  @Post()
  async create(@TenantId() tenantId: string, @Body() body: CreateEmployeeDto) {
    const password = body.password?.trim() || 'password123';
    const roleName = body.roleName || 'Employee';

    const created = await this.employeesService.createEmployeeWithUser(tenantId, {
      fullName: body.fullName,
      code: body.code,
      username: body.username,
      password,
      roleName,
    });

    return {
      ...created,
      tempPassword: password,
    };
  }
}
