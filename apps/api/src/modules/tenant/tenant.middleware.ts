import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const rawTenant = (req.headers['x-tenant-id'] as string | undefined)?.trim();
    if (!rawTenant) return next();

    // Allow passing either Company.id (uuid) or Company.code (short code).
    const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTenant);
    if (looksLikeUuid) {
      (req as any)['tenantId'] = rawTenant;
      return next();
    }

    try {
      const company = await (this.prisma as any).company.findFirst({
        where: { code: rawTenant.toUpperCase() },
        select: { id: true },
      });
      if (company?.id) {
        (req as any)['tenantId'] = company.id;
      }
    } catch {
      // ignore, TenantId decorator will enforce later
    }

    return next();
  }
}
