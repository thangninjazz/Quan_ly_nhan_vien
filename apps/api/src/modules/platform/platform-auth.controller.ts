import { Body, Controller, Post } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { PlatformAuthService } from './platform-auth.service';

class PlatformLoginDto {
  @IsString()
  @Length(3, 50)
  username!: string;

  @IsString()
  @Length(6, 100)
  password!: string;
}

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private platformAuthService: PlatformAuthService) {}

  @Post('login')
  async login(@Body() body: PlatformLoginDto) {
    return this.platformAuthService.login(body.username, body.password);
  }
}

