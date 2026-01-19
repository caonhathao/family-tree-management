import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtRequest } from 'src/modules/auth/types/jwt-payload.type';

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): string => {
    const { user }: { user: JwtRequest } = context.switchToHttp().getRequest();
    //console.log(user);
    return user.payload.sub;
  },
);
