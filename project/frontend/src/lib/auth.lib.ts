import { cache } from "react";
import { ResponseGetUserDto } from "@/modules/user/user.dto";
import { jwtDecode } from "jwt-decode";
import { getUserDetail } from "@/modules/user/user.actions";

interface payloadToken {
  payload: {
    sub: string;
    email: string;
  };
  iat: string;
  exp: string;
}

export const getuserFromToken = cache(async (token: string | undefined) => {
  if (!token || token.length === 0) return null;

  const payload: payloadToken = jwtDecode(token);

  const response = await getUserDetail(payload.payload.sub);
  return response as ResponseGetUserDto;
});
