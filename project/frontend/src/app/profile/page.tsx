"use server";

import { LoaderModule } from "@/components/shared/loader-module";

import { Suspense } from "react";
import ProfileContent from "./profile-content";
import { getUserDetailAction } from "@/modules/user/user.actions";
import { IResponseUserDto } from "@/modules/user/user.dto";
import { IErrorResponse } from "@/types/base.types";

export default async function ProfilePage() {
  const res: IResponseUserDto | IErrorResponse | null =
    await getUserDetailAction("self");

  return (
    <Suspense fallback={<LoaderModule />}>
      <ProfileContent data={res} />
    </Suspense>
  );
}
