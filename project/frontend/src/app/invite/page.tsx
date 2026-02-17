"use server";

import { LoaderModule } from "@/components/shared/loader-module";
import { joinGroupAcion } from "@/modules/group-family/group-family.actions";
import { Suspense } from "react";
import InviteContent from "./invite-content-page";
import { IResponseJoinGroupDto } from "@/modules/group-family/group-family.dto";
import { IErrorResponse } from "@/types/base.types";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const { token } = await searchParams;
  const res: IResponseJoinGroupDto | IErrorResponse | null =
    await joinGroupAcion(token);

  return (
    <Suspense fallback={<LoaderModule />}>
      <InviteContent data={res} />
    </Suspense>
  );
}
