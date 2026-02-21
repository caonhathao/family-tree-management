import { SetMetadata } from '@nestjs/common';
import { MEMBER_ROLE } from '@prisma/client';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: MEMBER_ROLE[]) => SetMetadata(ROLES_KEY, roles);
