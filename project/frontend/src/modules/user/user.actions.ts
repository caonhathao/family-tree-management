"use server";
import { UserService } from "./user.service";
import { handleError } from "@/lib/utils/funcs.utils";
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

export async function UpdateUserInfoAction(userId: string, data: IUserInfoDto) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }

    const res: IResponseUserDto = await UserService.updateUserInfo(
      userId,
      currentUserId,
      data,
    );

    return res as IResponseUserDto;
  } catch (err) {
    return handleError(err);
  }
}

export const getUserDetailAction = cache(
  async (type: "self" | "target", userId?: string) => {
    try {
      const headerList = await headers();
      const currentUserId = headerList.get("X-User-Id");

      if (!currentUserId) {
        throw new Error("Unauthorized");
      }

      const res = await UserService.getUserDetail(type, currentUserId, userId);
      return res;
    } catch (err) {
      return handleError(err);
    }
  },
);

export const getUserListAction = cache(
  async (
    page?: number,
    limit?: number,
    filterType?: string,
    filter?: string,
  ) => {
    try {
      const headerList = await headers();
      const currentUserId = headerList.get("X-User-Id");
      if (!currentUserId) {
        throw new Error("Unauthorized");
      }
      const res = await UserService.getAllUser(
        currentUserId,
        page,
        limit,
        filter,
        filterType,
      );
      return res as IPaginationBase<IUserList[]>;
    } catch (err) {
      return handleError(err);
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
    const res = await UserService.getAllAuthProviders(currentUserId);
    return res as IResponseLinkProvidersDto[];
  } catch (err) {
    return handleError(err);
  }
});

export const getAllAuthLogs = cache(async (page: number, limit: number) => {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }
    const res = await UserService.getAllAuthLog({
      userId: currentUserId,
      page: page,
      limit: limit,
    });
    return res as IPaginationBase<IResponseAuthLog[]>;
  } catch (err) {
    return handleError(err);
  }
});
