import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PlatformAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const prisma = this.prisma as any;
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, passwordHash: true, isSuperAdmin: true },
    });
    if (!user || !user.isSuperAdmin) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      tenantId: null,
      isSuperAdmin: true,
    });

    return {
      access_token: accessToken,
      user: { id: user.id, username: user.username },
      roles: ['SuperAdmin'],
    };
  }
}

