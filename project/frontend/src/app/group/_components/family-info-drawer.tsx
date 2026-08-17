"use client";
import { Toaster } from "@/components/shared/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { MEMBER_ROLE } from "@/types/enums";
import { RemoveFromGroupAction } from "@/modules/group-member/group-member.actions";
import { RootState } from "@/store";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { CiLogout } from "react-icons/ci";
import { IoMdKey } from "react-icons/io";
import { IoSwapVertical } from "react-icons/io5";
import { MdOutlineInfo } from "react-icons/md";
import { TbEdit } from "react-icons/tb";
import { useSelector } from "react-redux";
import FamilyInfoForm from "./forms/family-info-form";
import { FamilyEventsList } from "./family-events-list";
import { ApiResponse } from "@/types/api.types";

export const FamilyInfoDrawer = ({
  data,
}: {
  data: IResponseGroupFamilyDetailDto;
}) => {
  const { profile } = useSelector((state: RootState) => state.user);
  const amILeader = data.groupMembers.some(
    (m) => m.member.userProfile.userId === profile.id && m.isLeader,
  );
  const canManage = data.groupMembers.some(
    (m) =>
      m.member.userProfile.userId === profile.id &&
      (m.role === MEMBER_ROLE.OWNER || m.role === MEMBER_ROLE.EDITOR),
  );

  const [isUpdateInfo, setIsUpdateInfo] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleRemoveMember = async (memberId: string) => {
    const res: ApiResponse<never, unknown> | undefined =
      await RemoveFromGroupAction(data.id, memberId);
    if (res !== undefined) {
      Toaster({
        title: "Lỗi",
        description:
          (res.message as string) || "Không thể xóa thành viên khỏi nhóm",
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
        <DrawerTrigger asChild className={"hover:cursor-pointer"}>
          <Button
            variant={"outline"}
            size={"icon-lg"}
            className={"border hover:shadow-md active:scale-[0.98]"}
          >
            <MdOutlineInfo />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <div className={"w-full flex flex-col gap-1"}>
              <div className={"relative w-full flex flex-row justify-between"}>
                <DrawerTitle className={"text-base sm:text-lg lg:text-xl"}>
                  {data.name || "Nhóm gia đình"}
                </DrawerTitle>
                {amILeader ? (
                  <Button
                    type={"button"}
                    variant={"outline"}
                    size={"icon"}
                    className={
                      "hover:cursor-pointer border hover:shadow-md active:scale-[0.98]"
                    }
                    onClick={() => setIsUpdateInfo(true)}
                  >
                    <TbEdit />
                  </Button>
                ) : null}
                {isUpdateInfo ? (
                  <FamilyInfoForm data={data} setIsUpdate={setIsUpdateInfo} />
                ) : null}
              </div>
              <DrawerDescription className={"text-sm sm:text-base"}>
                {data.description || "Chưa có mô tả"}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <Tabs defaultValue={"members"} className={"w-full p-2"}>
            <TabsList className={"w-full"}>
              <TabsTrigger value={"members"} className={"flex-1"}>
                Thành viên
              </TabsTrigger>
              <TabsTrigger value={"events"} className={"flex-1"}>
                Sự kiện
              </TabsTrigger>
            </TabsList>
            <TabsContent value={"members"}>
              <div
                className={
                  "w-full flex flex-col gap-3 justify-center items-start"
                }
              >
                <p className={"text-sm font-semibold sm:text-base lg:text-lg"}>
                  Thành viên nhóm
                </p>
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
                        "col-span-4 flex flex-row justify-between items-center text-sm sm:text-base"
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
                            className={
                              "hover:cursor-pointer border hover:shadow-md active:scale-[0.98]"
                            }
                          >
                            <BsThreeDotsVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuGroup>
                          <DropdownMenuContent>
                            {/* dont show this option for leader */}
                            {amILeader && !item.isLeader ? (
                              <DropdownMenuItem
                                className={
                                  "hover:cursor-pointer text-sm sm:text-base"
                                }
                                onClick={() =>
                                  handleRemoveMember(
                                    item.member.userProfile.userId,
                                  )
                                }
                              >
                                <CiLogout />
                                Xóa khỏi nhóm
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              className={
                                "hover:cursor-pointer text-sm sm:text-base"
                              }
                            >
                              <MdOutlineInfo />
                              Thông tin
                            </DropdownMenuItem>
                            {!item.isLeader ? (
                              <DropdownMenuItem
                                disabled={
                                  item.member.userProfile.userId === profile.id
                                }
                                className={
                                  "hover:cursor-pointer text-sm sm:text-base"
                                }
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
            </TabsContent>
            <TabsContent value={"events"}>
              <FamilyEventsList groupId={data.id} canManage={canManage} />
            </TabsContent>
          </Tabs>
        </DrawerContent>
      </Drawer>
    </>
  );
};
