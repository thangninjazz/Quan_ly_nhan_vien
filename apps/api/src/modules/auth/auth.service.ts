import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private signAccessToken(payload: { sub: string; username: string; tenantId: string | null; isSuperAdmin?: boolean }) {
    return this.jwtService.sign(payload);
  }

  async validateUser(tenantId: string, username: string, pass: string) {
    const prisma = this.prisma as any;
    const user = await prisma.user.findFirst({
      where: { username, employee: { companyId: tenantId } },
      include: { employee: true, roles: { include: { role: true } } },
    });
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(tenantId: string, user: { id: string; username: string; employee: { companyId: string }; roles?: any[] }) {
    if (user.employee.companyId !== tenantId) throw new UnauthorizedException('Tenant mismatch');

    const payload = { username: user.username, sub: user.id, tenantId, isSuperAdmin: false };
    const accessToken = this.signAccessToken(payload);

    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const prisma = this.prisma as any;
    await prisma.refreshToken.create({
      data: {
        companyId: tenantId,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      user: { id: user.id, username: user.username },
      roles: user.roles?.map((ur: any) => ur.role.name) || [],
    };
  }

  async refresh(tenantId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const prisma = this.prisma as any;
    const existing = await prisma.refreshToken.findFirst({
      where: { tokenHash, companyId: tenantId, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { employee: true, roles: { include: { role: true } } } } },
    });

    if (!existing) throw new UnauthorizedException('Invalid refresh token');

    const payload = { username: existing.user.username, sub: existing.userId, tenantId, isSuperAdmin: false };
    const accessToken = this.signAccessToken(payload);

    const newRefreshToken = randomBytes(48).toString('base64url');
    const newRefreshTokenHash = this.hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          companyId: tenantId,
          userId: existing.userId,
          tokenHash: newRefreshTokenHash,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_at: newExpiresAt.toISOString(),
      user: { id: existing.userId, username: existing.user.username },
      roles: existing.user.roles?.map((ur: any) => ur.role.name) || [],
    };
  }

  async logout(tenantId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const prisma = this.prisma as any;
    await prisma.refreshToken.updateMany({
      where: { companyId: tenantId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
}
