import { Controller, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

const { diskStorage } = require('multer') as any;

function filenameFromOriginal(originalName: string) {
  const safeExt = extname(originalName).slice(0, 10);
  return `${randomUUID()}${safeExt || ''}`;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @RequirePermission('production.submit')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, _file: any, cb: any) => {
          const tenantId = (req as any).tenantId as string | undefined;
          const base = join(process.cwd(), 'uploads');
          const dir = tenantId ? join(base, tenantId) : base;
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req: any, file: any, cb: any) => {
          cb(null, filenameFromOriginal(file.originalname));
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async upload(@TenantId() tenantId: string, @UploadedFile() file: Express.Multer.File) {
    const path = `/uploads/${tenantId}/${file.filename}`;
    return { url: path };
  }
}
