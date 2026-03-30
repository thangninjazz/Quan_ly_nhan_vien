import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request['tenantId'];
    if (!tenantId) {
      throw new UnauthorizedException('X-Tenant-Id is required for this operation');
    }

    const tokenTenantId = request?.user?.tenantId;
    if (tokenTenantId && tokenTenantId !== tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }
    return tenantId;
  },
);
