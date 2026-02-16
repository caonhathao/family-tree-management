"use server";
import { ResponseUpdateUserDto } from "./user.dto";
import { UserService } from "./user.service";
import { handleError } from "@/lib/utils.lib";
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

    const res = await UserService.updateUser(userId, currentUserId, formDataObj as any);
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

export async function getUserDetail(userId: string) {
  try {
    const headerList = await headers();
    const currentUserId = headerList.get("X-User-Id");
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }

    const res = await UserService.getUserDetail(userId, currentUserId);
    return res;
  } catch (err) {
    return handleError(err);
  }
}
