"use server";
import { UserService } from "./user.service";
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

export async function UpdateUserInfoAction(
  userId: string,
  data: IUserInfoDto,
): Promise<IResponseUserDto | ApiResponse<IResponseUserDto, unknown>> {
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

      const res: IResponseUserDto = await UserService.getUserDetail(
        type,
        currentUserId,
        userId,
      );
      return res;
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
      const headerList = await headers();
      const currentUserId = headerList.get("X-User-Id");
      if (!currentUserId) {
        throw new Error("Unauthorized");
      }
      const res: IPaginationBase<IUserList[]> = await UserService.getAllUser(
        currentUserId,
        page,
        limit,
        filter,
        filterType,
      );
      return res;
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
    const res:
      | IResponseLinkProvidersDto[]
      | ApiResponse<IResponseLinkProvidersDto[], unknown> =
      await UserService.getAllAuthProviders(currentUserId);
    return res;
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
    const res = await UserService.getAllAuthLog({
      userId: currentUserId,
      page: page,
      limit: limit,
    });
    return res as IPaginationBase<IResponseAuthLog[]>;
  } catch (err) {
    return ResponseFactory.handleError(err);
  }
});
