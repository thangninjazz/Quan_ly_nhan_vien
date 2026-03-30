import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export function RequirePermission(permissionCode: string) {
  return SetMetadata(REQUIRED_PERMISSION_KEY, permissionCode);
}

