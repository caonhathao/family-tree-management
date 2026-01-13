import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_ROLE } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Exception } from '../messages/messages.response';
import { JwtRequest } from 'src/modules/auth/types/jwt-payload.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách Role yêu cầu từ Decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<USER_ROLE[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có Decorator @Roles, cho phép truy cập (Public hoặc chỉ cần Login)
    if (!requiredRoles) return true;

    // 2. Lấy User từ Request (do JwtAuthGuard nạp vào trước đó)
    const { user }: { user: JwtRequest } = context.switchToHttp().getRequest();
    // console.log(user.payload);

    if (!user || !user.payload.role) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    // 3. Kiểm tra xem Role của User có nằm trong danh sách yêu cầu không
    const hasPermission = requiredRoles.some(
      (role) => user.payload.role === role,
    );

    if (!hasPermission) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    return true;
  }
}
