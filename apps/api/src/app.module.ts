import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { ProductModule } from './modules/product/product.module';
import { ProductionModule } from './modules/production/production.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { AllowanceModule } from './modules/allowance/allowance.module';
import { PermissionGuard } from './common/guards/permission.guard';
import { EmployeesModule } from './modules/employees/employees.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PlatformModule } from './modules/platform/platform.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductModule,
    ProductionModule,
    PayrollModule,
    AllowanceModule,
    EmployeesModule,
    UploadsModule,
    DashboardModule,
    PlatformModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
