import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@TenantId() tenantId: string, @Body() loginDto: { username: string; password: string }) {
    const user = await this.authService.validateUser(tenantId, loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(tenantId, user);
  }

  @Post('refresh')
  async refresh(@TenantId() tenantId: string, @Body() body: { refresh_token: string }) {
    return this.authService.refresh(tenantId, body.refresh_token);
  }

  @Post('logout')
  async logout(@TenantId() tenantId: string, @Body() body: { refresh_token: string }) {
    return this.authService.logout(tenantId, body.refresh_token);
  }
}
