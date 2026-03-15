import { cache } from "react";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { JwtPayload } from "@/types/base.types";
import { IUserSession } from "@/types/auth.types";

export const getUserFromToken = cache(async (token: string | undefined) => {
  if (!token || token.length === 0) return null;

  try {
    const payload: JwtPayload = jwtDecode(token);
    const userId = payload?.id;

    if (!userId) return null;

    return await getUserFromUserId(userId);
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
});

export const getRoleFromToken = cache(async (token: string | undefined) => {
  if (!token || token.length === 0) return null;

  try {
    const payload: JwtPayload = jwtDecode(token);
    const role = payload;

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
