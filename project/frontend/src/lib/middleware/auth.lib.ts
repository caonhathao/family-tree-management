import { cache } from "react";
import { IUserSession } from "@/types/auth.types";
import { apiClient } from "@/lib/api/api-client.lib";
import { apiRequest } from "@/lib/api/http.client";

export const getUserFromToken = cache(
  async (accessToken: string | undefined) => {
    if (!accessToken || accessToken.length === 0) return null;

    try {
      const res = await apiRequest<IUserSession>(
        apiClient.user.getDetail.url("me"),
        {
          method: "GET",
          token: accessToken,
        },
      );

      if (res && "data" in res && res.data) {
        return res.data;
      }
      return null;
    } catch (error) {
      console.error("Error getting user from token:", error);
      return null;
    }
  },
);

export const getRoleFromToken = cache(async (token: string | undefined) => {
  if (!token || token.length === 0) return null;

  try {
    const res = await apiRequest<{ role?: string }>(
      apiClient.user.getDetail.url("me"),
      {
        method: "GET",
        token,
      },
    );

    if (res && "data" in res && res.data) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.error("Error getting role from token:", error);
    return null;
  }
});

export const getUserFromUserId = cache(async (userId: string) => {
  if (!userId || userId.length === 0) return null;

  try {
    const res = await apiRequest<IUserSession>(
      apiClient.user.getDetail.url(userId),
      {
        method: "GET",
      },
    );

    if (res && "data" in res && res.data) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.error("Error getting user from userId:", error);
    return null;
  }
});
