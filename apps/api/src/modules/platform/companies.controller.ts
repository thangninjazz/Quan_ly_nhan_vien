import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { CompaniesService } from './companies.service';
import { IsOptional, IsString, Length } from 'class-validator';

class CreateCompanyDto {
  @IsString()
  @Length(3, 20)
  code!: string;

  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  adminUsername?: string;

  @IsOptional()
  @IsString()
  @Length(6, 100)
  adminPassword?: string;
}

class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @Length(3, 20)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;
}

@Controller('platform/companies')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  async list() {
    return this.companiesService.listCompanies();
  }

  @Post()
  async create(@Body() body: CreateCompanyDto) {
    return this.companiesService.createCompany(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCompanyDto) {
    return this.companiesService.updateCompany(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.companiesService.deleteCompany(id);
  }
}

