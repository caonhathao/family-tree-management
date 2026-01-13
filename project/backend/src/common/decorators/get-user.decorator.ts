import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// 1. Định nghĩa cấu trúc của User mà bạn đã trả về từ hàm validate() trong Strategy
export interface JwtPayloadWithRt {
  userId: string;
  email: string;
  role: string;
  refreshToken?: string; // Có dấu ? vì Access Token sẽ không có trường này
}

export const GetCurrentUser = createParamDecorator(
  (data: keyof JwtPayloadWithRt | undefined, context: ExecutionContext) => {
    // 2. Ép kiểu cho Request để TS biết có thuộc tính .user
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayloadWithRt }>();

    const user = request.user;

    // 3. Nếu không truyền key (data), trả về toàn bộ user object
    if (!data) return user;

    // 4. Trả về đúng trường được yêu cầu
    return user ? user[data] : undefined;
  },
);
