import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) return true;

    const request = context.switchToHttp().getRequest();
    if (!request?.user?.userId) {
      const authHeader = (request?.headers?.authorization || request?.headers?.Authorization) as string | undefined;
      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) throw new UnauthorizedException();
      const token = authHeader.slice('bearer '.length).trim();
      try {
        const payload: any = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'super-secret-key-123',
        });
        request.user = {
          userId: payload.sub,
          username: payload.username,
          tenantId: payload.tenantId,
          isSuperAdmin: payload.isSuperAdmin,
        };
      } catch {
        throw new UnauthorizedException();
      }
    }

    const userId: string | undefined = request?.user?.userId;
    if (!userId) throw new UnauthorizedException();

    const tenantId = (request?.tenantId || request?.['tenantId']) as string | undefined;
    if (!tenantId) throw new UnauthorizedException('X-Tenant-Id is required');

    const tokenTenantId = request?.user?.tenantId as string | undefined;
    if (tokenTenantId && tokenTenantId !== tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    const hasPermission = await this.prisma.userRole.count({
      where: {
        userId,
        role: {
          companyId: tenantId,
          permissions: {
            some: {
              permission: { code: permission },
            },
          },
        },
      },
    });

    if (!hasPermission) throw new ForbiddenException('Insufficient permission');
    return true;
  }
}
