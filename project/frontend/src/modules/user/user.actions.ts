"use server";
import { ResponseDataBase } from "@/types/base.types";
import { ResponseUpdateUserDto } from "./user.dto";
import { UserServices } from "./user.service";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";

export async function UpdateUserAction(userId: string, data: FormData) {
  let isSuccess = false;
  try {
    const res: ResponseDataBase<ResponseUpdateUserDto> =
      await UserServices.updateUser(userId, data);
    if (res.success) {
      isSuccess = true;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath("/user");
  }
}
export async function getUserDetail(userId: string) {
  try {
    const res = await UserServices.getUserDetail(userId);
    
    if (res.success) {
      return res.data;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
}
