"use server";

import { LoaderModule } from "@/components/shared/loader-module";
import { joinGroupAcion } from "@/modules/group-family/group-family.actions";
import { Suspense } from "react";
import InviteContent from "./invite-content-page";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const { token } = await searchParams;
  const res = await joinGroupAcion(token);
  console.log(res);

  if (!res || "error" in res) return <div>{res?.error || "Failed to join group"}</div>;
  else
    return (
      <Suspense fallback={<LoaderModule />}>
        <InviteContent data={res} />
      </Suspense>
    );
}
