import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';
import { IS_LEADER_KEY } from '../decorators/leader.decorator';
import { JwtRequest } from 'src/modules/auth/types/jwt-payload.type';
import { Exception } from '../messages/messages.response';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: JwtRequest;
}

@Injectable()
export class GroupLeaderGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Kiểm tra xem API có gắn nhãn @IsLeader() không
    const isLeaderRequired = this.reflector.getAllAndOverride<boolean>(
      IS_LEADER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isLeaderRequired) return true;

    const req: AuthenticatedRequest = context.switchToHttp().getRequest();
    const { user }: AuthenticatedRequest = req;
    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }
    const userId = user?.payload.sub;
    const groupId = req.params.id;

    if (!userId || !groupId) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin định danh hoặc nhóm',
      );
    }

    // 2. Truy vấn DB check quyền
    const member = await this.prisma.groupMember.findUnique({
      where: {
        memberId_groupId: {
          groupId: groupId as string,
          memberId: userId,
        },
      },
      select: { isLeader: true },
    });

    if (!member || !member.isLeader) {
      throw new ForbiddenException(
        'Chỉ Leader của nhóm mới có quyền thực hiện hành động này',
      );
    }

    return true;
  }
}
