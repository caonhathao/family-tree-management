"use client";
import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getInviteGroupInfoAction,
  joinGroupAction,
} from "@/modules/group-family/group-family.actions";
import { IResponseInviteGroupInfoDto } from "@/modules/group-family/group-family.dto";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const InvitePage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();
  const [groupInfo, setGroupInfo] =
    useState<IResponseInviteGroupInfoDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (token === "") return;

    const fetchGroupInfo = async () => {
      setLoading(true);
      try {
        const result = await getInviteGroupInfoAction(token);
        if (result && "id" in result) {
          setGroupInfo(result);
          setError(null);
        } else {
          setError("Lời mời không hợp lệ hoặc đã hết hạn");
        }
      } catch (err) {
        console.log(err);
        setError("Lời mời không hợp lệ hoặc đã hết hạn");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupInfo();
  }, [token]);

  const handleJoinGroup = async () => {
    setJoining(true);
    try {
      const result = await joinGroupAction(token);
      if (result && "groupId" in result) {
        Toaster({
          title: "Tham gia thành công",
          description: "Bạn đã tham gia vào nhóm thành công",
          duration: 2000,
          type: "success",
        });
        setTimeout(() => {
          router.push(`/group?groupId=${result.groupId}`);
        }, 2000);
      } else if (result && "errors" in result) {
        Toaster({
          title: "Có lỗi xảy ra",
          description: result.message,
          duration: 2000,
          type: "error",
          cancel: { label: "OK", onClick: () => {} },
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setJoining(false);
    }
  };

  if (token === "")
    return (
      <div>
        <p>Lời mời không hợp lệ</p>
      </div>
    );

  if (loading)
    return (
      <div>
        <p>Đang tải thông tin nhóm...</p>
      </div>
    );

  if (error || !groupInfo)
    return (
      <div>
        <p>{error}</p>
      </div>
    );

  return (
    <div
      className={
        "w-fit grid grid-cols-1 grid-rows-2 gap-3 justify-center items-center"
      }
    >
      <div className={"text-center"}>
        <p className={"font-semibold text-lg"}>{groupInfo.name}</p>
        {groupInfo.description && (
          <p className={"text-sm text-muted-foreground"}>
            {groupInfo.description}
          </p>
        )}
        <p className={"text-sm"}>
          {groupInfo.sender
            ? `${groupInfo.sender.fullName} đã mời bạn tham gia nhóm`
            : "Bạn muốn tham gia vào nhóm này?"}{" "}
          • {groupInfo.memberCount} thành viên
        </p>
      </div>
      <div className={cn("w-full grid grid-cols-2 gap-3")}>
        <Button variant={"outline"} onClick={() => router.back()}>
          Từ chối
        </Button>
        <Button onClick={() => handleJoinGroup()} disabled={joining}>
          {joining ? "Đang tham gia..." : "Tham gia"}
        </Button>
      </div>
    </div>
  );
};
export default InvitePage;
