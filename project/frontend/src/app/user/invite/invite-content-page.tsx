"use client";
import { LoaderModule } from "@/components/shared/loader-module";
import { Toaster } from "@/components/shared/toast";
import { IResponseJoinGroupDto } from "@/modules/group-family/group-family.dto";
import { IErrorResponse } from "@/types/base.types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const InviteContent = ({
  data,
}: {
  data: IResponseJoinGroupDto | IErrorResponse | null;
}) => {
  const router = useRouter();
  useEffect(() => {
    if (data && "id" in data) {
      router.push(`/group?groupId=${data.groupId}`);
    }
  }, [data, router]);
  if (!data || "error" in data)
    return Toaster({
      title: "Có lỗi xảy ra",
      description: data?.error || "Vui lòng thử lại sau!",
      type: "error",
      cancel: { label: "OK", onClick: () => {} },
    });
  else
    return (
      <div
        className={"w-full h-screen flex flex-col items-center justify-center"}
      >
        <LoaderModule scale={1} className={"h-10 w-10"} />
      </div>
    );
};

export default InviteContent;
