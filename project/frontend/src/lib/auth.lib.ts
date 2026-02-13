import { cache } from "react";
import { IResponseGetUserDto } from "@/modules/user/user.dto";
import { jwtDecode } from "jwt-decode";
import { getUserDetail } from "@/modules/user/user.actions";
import { IErrorResponse } from "@/types/base.types";

interface payloadToken {
  payload: {
    sub: string;
    email: string;
  };
  iat: string;
  exp: string;
}

export const getUserFromToken = cache(async (token: string | undefined) => {
  if (!token || token.length === 0) return null;

  const payload: payloadToken = jwtDecode(token);
  //console.log("payload", payload);

  const response: IResponseGetUserDto | IErrorResponse = await getUserDetail(
    payload.payload.sub,
  );
  return response;
});
