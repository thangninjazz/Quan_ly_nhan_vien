import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request?.user?.userId) throw new UnauthorizedException();
    if (!request?.user?.isSuperAdmin) throw new ForbiddenException('Super admin required');
    return true;
  }
}

