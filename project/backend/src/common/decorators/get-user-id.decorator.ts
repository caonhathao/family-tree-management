import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { JwtRequest } from 'src/modules/auth/types/jwt-payload.type';
import { Exception } from '../messages/messages.response';

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): string => {
    const { user }: { user: JwtRequest } = context.switchToHttp().getRequest();
    //console.log(user);

    if (!user || !user.payload || !isUUID(user.payload.sub)) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }
    return user.payload.sub;
  },
);
