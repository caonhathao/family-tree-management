"use client";
import { LoaderModule } from "@/components/shared/loader-module";
import { Suspense } from "react";
import InviteContentPage from "./invite-content-page";

export default function InvitePage() {
  return (
    <Suspense fallback={<LoaderModule />}>
      <InviteContentPage />
    </Suspense>
  );
}
