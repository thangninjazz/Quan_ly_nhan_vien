import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AllowanceService } from './allowance.service';
import { AllowanceController } from './allowance.controller';

@Module({
  imports: [AuthModule],
  providers: [AllowanceService],
  controllers: [AllowanceController],
})
export class AllowanceModule {}

