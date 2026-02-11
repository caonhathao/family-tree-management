"use server";

import { LoaderModule } from "@/components/shared/loader-module";
import { Suspense } from "react";
import { GroupContentWrapper } from "./components/group-content-wrapper";

export default async function GroupPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId: string }>;
}) {
  const { groupId } = await searchParams;

  return (
    <Suspense fallback={<LoaderModule />}>
      <GroupContentWrapper groupId={groupId} />
    </Suspense>
  );
}
