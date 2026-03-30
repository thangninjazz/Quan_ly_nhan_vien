import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @Length(1, 200)
  fullName!: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  code?: string;

  @IsString()
  @Length(3, 50)
  username!: string;

  @IsOptional()
  @IsString()
  @Length(6, 100)
  password?: string;

  @IsOptional()
  @IsIn(['Employee', 'Manager', 'Admin'])
  roleName?: 'Employee' | 'Manager' | 'Admin';
}

