"use server";
import { UserService } from "./user.service";
import { handleError } from "@/lib/util/utils.lib";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function UpdateUserAction(userId: string, data: FormData) {
  let isSuccess = false;
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }

    const formDataObj: Record<string, string> = {};
    data.forEach((value, key) => {
      formDataObj[key] = value.toString();
    });

    const res = await UserService.updateUser(
      userId,
      currentUserId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formDataObj as any,
    );
    if (res) {
      isSuccess = true;
    } else {
      return { err: "Update failed" };
    }
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath("/user");
  }
}

export async function getUserDetail(type: string, userId?: string) {
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
}
