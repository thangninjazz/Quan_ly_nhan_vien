import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-123',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [PlatformAuthController, CompaniesController],
  providers: [PlatformAuthService, CompaniesService],
})
export class PlatformModule {}

