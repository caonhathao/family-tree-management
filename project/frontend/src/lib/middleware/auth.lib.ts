import { cache } from "react";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { IResponseGetUserDto } from "@/modules/user/user.dto";
import { USER_ROLE } from "@prisma/client";

interface JwtTokenPayload {
  payload: {
    id: string;
    role: USER_ROLE;
  };
  iat?: number;
  exp?: number;
}

export const getUserFromToken = cache(async (token: string | undefined) => {
  if (!token || token.length === 0) return null;

  try {
    const payload: JwtTokenPayload = jwtDecode(token);
    const userId = payload.payload?.id;

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
    const payload: JwtTokenPayload = jwtDecode(token);
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
        email: true,
        userProfile: {
          select: {
            fullName: true,
            avatar: true,
            dateOfBirth: true,
            biography: true,
          },
        },
      },
    });

    if (!user) return null;

    const response: IResponseGetUserDto = {
      id: user.id,
      email: user.email,
      userProfile: {
        fullName: user.userProfile?.fullName || "",
        avatar: user.userProfile?.avatar || "",
        dateOfBirth: user.userProfile?.dateOfBirth || new Date(),
        biography:
          typeof user.userProfile?.biography === "string"
            ? user.userProfile.biography
            : JSON.stringify(user.userProfile?.biography || {}),
      },
    };

    return response;
  } catch (error) {
    console.error("Error getting user from userId:", error);
    return null;
  }
});
