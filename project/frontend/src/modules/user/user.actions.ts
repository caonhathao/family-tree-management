"use server";
import { headers } from "next/headers";
import {
  IResponseAuthLog,
  IResponseLinkProvidersDto,
  IResponseUserDto,
  IUserInfoDto,
  IUserList,
} from "./user.dto";
import { cache } from "react";
import { IPaginationBase } from "@/types/base.types";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ApiResponse } from "@/types/api.types";
import { apiRequest } from "@/lib/api/http.client";
import { apiClient } from "@/lib/api/api-client.lib";

export async function UpdateUserInfoAction(
  userId: string,
  data: IUserInfoDto,
): Promise<IResponseUserDto | ApiResponse<IResponseUserDto, unknown>> {
  try {
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const res = await apiRequest<IResponseUserDto>(
      apiClient.user.updateUser.url(userId),
      {
        method: apiClient.user.updateUser.method,
        body: data,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }

    return res;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
}

export const getUserDetailAction = cache(
  async (
    type: "self" | "target",
    userId?: string,
  ): Promise<IResponseUserDto | ApiResponse<IResponseUserDto, unknown>> => {
    try {
      const headerList = await headers();
      const currentUserId = headerList.get("X-User-Id");

      if (!currentUserId) {
        throw new Error("Unauthorized");
      }

      const targetId = type === "self" ? currentUserId : userId;
      if (!targetId) {
        throw new Error("Unauthorized");
      }

      const res = await apiRequest<IResponseUserDto>(
        apiClient.user.getDetail.url(targetId),
        {
          method: apiClient.user.getDetail.method,
          query: { type },
        },
      );

      if (res && "data" in res && res.data != undefined) {
        return res.data;
      }
      return ResponseFactory.error({
        message: "User not found",
        code: 404,
      });
    } catch (err) {
      return ResponseFactory.handleError(err);
    }
  },
);

export const getUserListAction = cache(
  async (
    page?: number,
    limit?: number,
    filterType?: string,
    filter?: string,
  ): Promise<
    IPaginationBase<IUserList[]> | ApiResponse<IUserList[], unknown>
  > => {
    try {
      const res = await apiRequest<IPaginationBase<IUserList[]>>(
        apiClient.user.getAll.url,
        {
          method: apiClient.user.getAll.method,
          query: { page, limit, filter, filterType },
        },
      );

      if (res && "data" in res && res.data != undefined) {
        return res.data;
      }
      return ResponseFactory.error({
        message: "Users not found",
        code: 404,
      });
    } catch (err) {
      return ResponseFactory.handleError(err);
    }
  },
);

//get all linked auth providers
export const getAllLinkedAuthProviders = cache(async () => {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await apiRequest<IResponseLinkProvidersDto[]>(
      apiClient.user.getAuthProviders.url(currentUserId),
      {
        method: apiClient.user.getAuthProviders.method,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return [] as IResponseLinkProvidersDto[];
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
});

export const getAllAuthLogs = cache(async (page: number, limit: number) => {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await apiRequest<IPaginationBase<IResponseAuthLog[]>>(
      apiClient.user.getAuthLogs.url(currentUserId),
      {
        method: apiClient.user.getAuthLogs.method,
        query: { page, limit },
      },
    );
    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return {
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: limit,
      },
    } as IPaginationBase<IResponseAuthLog[]>;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
});
