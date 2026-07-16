import { LoaderModule } from "@/components/shared/loader-module";
import { getAllLinkedAuthProviders } from "@/modules/user/user.actions";
import { IResponseLinkProvidersDto } from "@/modules/user/user.dto";
import { IErrorResponse } from "@/types/base.types";
import { Suspense } from "react";
import SecureContent from "./secure-content";

export default async function SecurePage() {
  const res: IResponseLinkProvidersDto[] | IErrorResponse | null =
    await getAllLinkedAuthProviders();

  if (!res || "error" in res) {
    return (
      <div className={"w-full h-full flex justify-center items-center"}>
        <LoaderModule />
      </div>
    );
  }
  return (
    <Suspense fallback={<LoaderModule />}>
      <SecureContent data={res as IResponseLinkProvidersDto[]} />
    </Suspense>
  );
}
