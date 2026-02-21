import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MEMBER_ROLE } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Exception } from '../messages/messages.response';
import { JwtRequest } from 'src/modules/auth/types/jwt-payload.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { Request } from 'express';
import { isUUID } from 'class-validator';
interface AuthenticatedRequest extends Request {
  user?: JwtRequest;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Lấy danh sách Role yêu cầu từ Decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<MEMBER_ROLE[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có Decorator @Roles, cho phép truy cập (Public hoặc chỉ cần Login)
    if (!requiredRoles) return true;

    // 2. Lấy User từ Request (do JwtAuthGuard nạp vào trước đó)
    const req: AuthenticatedRequest = context.switchToHttp().getRequest();
    const { user }: AuthenticatedRequest = req;
    // console.log(user.payload);

    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    const groupId = req.params.groupId || req.query.groupId;

    if (!groupId || !isUUID(groupId)) return false;
    else {
      const member = await this.prisma.groupMember.findUnique({
        where: {
          memberId_groupId: {
            memberId: user.payload.sub,
            groupId: groupId as string,
          },
        },
        select: {
          role: true,
          isLeader: true,
        },
      });

      if (!member) {
        throw new ForbiddenException(Exception.NOT_EXIST);
      }

      if (member.isLeader) return true;

      const hasPermission = requiredRoles.includes(member.role);

      if (!hasPermission) {
        throw new ForbiddenException(Exception.PEMRISSION);
      }
    }

    return true;
  }
}
