"use client";
import { Toaster } from "@/components/shared/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { quitGroupAction } from "@/modules/group-family/group-family.actions";
import { IResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { RemoveFromGroupAction } from "@/modules/group-member/group-member.actions";
import { CreateInviteLinkAction } from "@/modules/invite/invite.actions";
import {
  ICreateInviteDto,
  IResponseCreateInviteDto,
} from "@/modules/invite/invite.dto";
import { RootState } from "@/store";
import { IErrorResponse } from "@/types/base.types";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { CiLogout } from "react-icons/ci";
import { IoMdKey } from "react-icons/io";
import { IoSwapVertical } from "react-icons/io5";
import { MdOutlineInfo } from "react-icons/md";
import { TbEdit } from "react-icons/tb";
import { useSelector } from "react-redux";
import FamilyInfoForm from "./forms/family-info-form";

export const FamilyInfoDrawer = ({
  data,
}: {
  data: IResponseGroupFamilyDetailDto;
}) => {
  const { profile } = useSelector((state: RootState) => state.user);
  const amILeader = data.groupMembers.some(
    (m) => m.member.userProfile.userId === profile.id && m.isLeader,
  );

  const [isUpdateInfo, setIsUpdateInfo] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleCopy = useCopyToClipboard();
  const handleCreateInviteLink = async () => {
    const payload: ICreateInviteDto = {
      groupId: data.id,
      expiresAt: new Date(),
    };
    const res:
      | { success: boolean; error: string }
      | IResponseCreateInviteDto
      | { err: string } = await CreateInviteLinkAction(payload);
    //console.log(res);
    if (res && "error" in res) {
      Toaster({
        title: "Lỗi",
        description: res.error as string,
        type: "error",
      });
    } else if (res && "inviteLink" in res) {
      Toaster({
        title: "Thành công",
        description: "Tạo thành công",
        type: "success",
      });
      handleCopy(window.location.origin + res.inviteLink);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const res: IErrorResponse | undefined = await RemoveFromGroupAction(
      data.id,
      memberId,
    );
    if (res !== undefined) {
      Toaster({
        title: "Lỗi",
        description:
          (res.error as string) || "Không thể xóa thành viên khỏi nhóm",
        type: "error",
      });
    }
  };

  const handleQuitGroup = async () => {
    const res: IErrorResponse | undefined = await quitGroupAction(data.id);
    if (res?.error) {
      Toaster({
        title: "Lỗi",
        description: res.error as string,
        type: "error",
      });
    }
  };

  // useEffect(() => {
  //   console.log(data);
  // }, [data]);

  return (
    <>
      <Drawer
        direction={"right"}
        open={isOpen}
        onOpenChange={(open) => {
          setIsUpdateInfo(false);
          setIsOpen(open);
        }}
      >
        <DrawerTrigger
          asChild
          className={"fixed right-3 top-15 hover:cursor-pointer"}
        >
          <Button variant={"outline"} size={"icon-lg"}>
            <MdOutlineInfo />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <div className={"w-full flex flex-col gap-1"}>
              <div className={"relative w-full flex flex-row justify-between"}>
                <DrawerTitle>{data.name || "Nhóm gia đình"}</DrawerTitle>
                <Button
                  type={"button"}
                  variant={"outline"}
                  size={"icon"}
                  className={"hover:cursor-pointer"}
                  onClick={() => setIsUpdateInfo(true)}
                >
                  <TbEdit />
                </Button>
                {isUpdateInfo ? (
                  <FamilyInfoForm data={data} setIsUpdate={setIsUpdateInfo} />
                ) : null}
              </div>
              <DrawerDescription>
                {data.description || "Chưa có mô tả"}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <div
            className={
              "w-full flex flex-col gap-3 justify-center items-start p-2"
            }
          >
            <p className={"font-semibold"}>Thành viên nhóm</p>
            {data.groupMembers.map((item, index) => (
              <div
                key={index}
                className={
                  "w-full grid grid-cols-6 justify-between items-center gap-2"
                }
              >
                <div className={"col-span-1"}>
                  <Avatar>
                    <AvatarImage src={item.member.userProfile.avatar} />
                    <AvatarFallback>
                      {
                        item.member.userProfile.fullName
                          .trim()
                          .split(" ")
                          .pop()?.[0]
                      }
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div
                  className={
                    "col-span-4 flex flex-row justify-between items-center"
                  }
                >
                  {item.member.userProfile.fullName}
                  {item.role === "OWNER" ? (
                    <p>(Chủ sở hữu)</p>
                  ) : item.role === "EDITOR" ? (
                    <p>(Biên soạn)</p>
                  ) : (
                    ""
                  )}
                  {item.isLeader ? <IoMdKey color={"yellow"} /> : ""}
                </div>
                <div className={"col-span-1"}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={"outline"}
                        size={"icon"}
                        className={"hover:cursor-pointer"}
                      >
                        <BsThreeDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuGroup>
                      <DropdownMenuContent>
                        {/* dont show this option for leader */}
                        {amILeader && !item.isLeader ? (
                          <DropdownMenuItem
                            className={"hover:cursor-pointer"}
                            onClick={() =>
                              handleRemoveMember(item.member.userProfile.userId)
                            }
                          >
                            <CiLogout />
                            Xóa khỏi nhóm
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem className={"hover:cursor-pointer"}>
                          <MdOutlineInfo />
                          Thông tin
                        </DropdownMenuItem>
                        {!item.isLeader ? (
                          <DropdownMenuItem
                            disabled={
                              item.member.userProfile.userId === profile.id
                            }
                            className={"hover:cursor-pointer"}
                          >
                            <IoSwapVertical />
                            Đổi vai trò
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenuGroup>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
          <DrawerFooter>
            <Button
              type={"button"}
              onClick={() => handleCreateInviteLink()}
              className={"hover:cursor-pointer"}
            >
              Tạo lời mời
            </Button>
            <Button
              type={"button"}
              variant={"destructive"}
              className={"hover:cursor-pointer"}
              onClick={() => handleQuitGroup()}
            >
              Rời khỏi nhóm
            </Button>
            <DrawerClose asChild>
              <Button variant={"outline"} className={"hover:cursor-pointer"}>
                Thoát
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
