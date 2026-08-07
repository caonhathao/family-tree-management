import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { IJwtVerifyResult } from "@/types/base.types";
import { IUserSession } from "@/types/auth.types";
import { jwtVerify } from "jose";
import { EnvConfig } from "../env/env-config.lib";

export const getUserFromToken = cache(
  async (accessToken: string | undefined) => {
    if (!accessToken || accessToken.length === 0) return null;

    try {
      const payload: IJwtVerifyResult = await jwtVerify(
        accessToken,
        new TextEncoder().encode(EnvConfig.jwtAccessSecret),
      );
      const userId = payload?.payload.id;

      if (!userId) return null;

      return await getUserFromUserId(userId);
    } catch (error) {
      console.error("Error getting user from token:", error);
      return null;
    }
  },
);

export const getRoleFromToken = cache(async (token: string | undefined) => {
  if (!token || token.length === 0) return null;

  try {
    const payload: IJwtVerifyResult = await jwtVerify(
      token,
      new TextEncoder().encode(EnvConfig.jwtRefreshSecret),
    );
    const role = payload.payload;

    if (!role) return null;

    return role;
  } catch (error) {
    console.error("Error getting role from token:", error);
    return null;
  }
});

export const getUserFromUserId = cache(async (userId: string) => {
  if (!userId || userId.length === 0) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userProfile: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!user) return null;

    const res: IUserSession = {
      fullName: user.userProfile?.fullName ?? "",
    };

    return res;
  } catch (error) {
    console.error("Error getting user from userId:", error);
    return null;
  }
});
