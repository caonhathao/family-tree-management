"use server";

import { LoaderModule } from "@/components/shared/loader-module";

import { Suspense } from "react";
import ProfileContent from "./profile-content";
import { getUserDetailAction } from "@/modules/user/user.actions";
import { IResponseUserDto } from "@/modules/user/user.dto";
import { ApiResponse } from "@/types/api.types";

export default async function ProfilePage() {
  const res: IResponseUserDto | ApiResponse<IResponseUserDto, unknown> =
    await getUserDetailAction("self");

  if (!res || "errors" in res) {
    return (
      <div className={"w-full h-full flex justify-center items-center"}>
        {res?.message || "Không thể tải thông tin người dùng"}
      </div>
    );
  }
  return (
    <Suspense fallback={<LoaderModule />}>
      <ProfileContent data={res} />
    </Suspense>
  );
}
