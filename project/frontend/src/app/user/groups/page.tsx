"use server";

import { LoaderModule } from "@/components/shared/loader-module";
import { Suspense } from "react";
import GroupsContent from "./_components/groups-content";
import { getAllGroupAction } from "@/modules/group-family/group-family.actions";
import { IResponseGroupFamiliesDto } from "@/modules/group-family/group-family.dto";
import { ApiResponse } from "@/types/api.types";

export default async function GroupsPage() {
  const res:
    | IResponseGroupFamiliesDto[]
    | ApiResponse<IResponseGroupFamiliesDto[], unknown> =
    await getAllGroupAction();

  if (!Array.isArray(res)) {
    return (
      <div
        className={
          "w-full h-full flex justify-center items-center text-sm text-muted-foreground"
        }
      >
        {res.message || "Không thể tải danh sách nhóm"}
      </div>
    );
  }

  return (
    <Suspense fallback={<LoaderModule />}>
      <GroupsContent groups={res} />
    </Suspense>
  );
}
