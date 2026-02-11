"use client";
import { IResponseJoinGroupDto } from "@/modules/group-family/group-family.dto";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const InviteContent = ({ data }: { data: IResponseJoinGroupDto }) => {
  const router = useRouter();
  useEffect(() => {
    if (data.id) {
      router.push(`/group?groupId=${data.groupId}`);
    }
  }, [data, router]);
  return <div>Đang tham gia nhóm...</div>;
};

export default InviteContent;
