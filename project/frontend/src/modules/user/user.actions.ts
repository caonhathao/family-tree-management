import { ResponseDataBase } from "@/types/base.types";
import { ResponseUpdateUserDto, UpdateUserDto } from "./user.dto";
import { UserServices } from "./user.service";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";

export async function UpdateUserAction(userId: string, data: UpdateUserDto) {
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
