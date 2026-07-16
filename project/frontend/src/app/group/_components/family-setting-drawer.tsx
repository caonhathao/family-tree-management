"use client";
import { Toaster } from "@/components/shared/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
  destroyGroupAction,
  quitGroupAction,
} from "@/modules/group-family/group-family.actions";
import { IResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { CreateInviteLinkAction } from "@/modules/invite/invite.actions";
import {
  ICreateInviteDto,
  IResponseCreateInviteDto,
} from "@/modules/invite/invite.dto";
import { RootState } from "@/store";
import { ApiResponse } from "@/types/api.types";
import { MdOutlineSettings } from "react-icons/md";
import { useSelector } from "react-redux";

const FamilySettingDrawer = ({
  data,
}: {
  data: IResponseGroupFamilyDetailDto;
}) => {
  const handleCopy = useCopyToClipboard();
  const { profile } = useSelector((state: RootState) => state.user);

  const amILeader = data.groupMembers.some(
    (m) => m.member.userProfile.userId === profile.id && m.isLeader,
  );
  const handleCreateInviteLink = async () => {
    const payload: ICreateInviteDto = {
      groupId: data.id,
      expiresAt: new Date(),
    };
    const res:
      | IResponseCreateInviteDto
      | ApiResponse<IResponseCreateInviteDto, unknown> =
      await CreateInviteLinkAction(payload);
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

  const handleQuitGroup = async () => {
    const res: ApiResponse<never, unknown> | undefined = await quitGroupAction(
      data.id,
    );
    if (res && "errors" in res) {
      Toaster({
        title: "Lỗi",
        description: res.message,
        type: "error",
      });
    }
  };
  const handleDestroyGroup = async () => {
    const res: ApiResponse<never, unknown> | undefined =
      await destroyGroupAction(data.id);
    if (res && "errors" in res) {
      Toaster({
        title: "Lỗi",
        description: res.message,
        type: "error",
      });
    }
  };
  return (
    <>
      <Drawer direction={"right"}>
        <DrawerTrigger asChild className={" hover:cursor-pointer"}>
          <Button variant={"outline"} size={"icon-lg"}>
            <MdOutlineSettings />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <div className={"w-full flex flex-col gap-1"}>
              <div className={"relative w-full flex flex-row justify-between"}>
                <DrawerTitle>{data.name || "Nhóm gia đình"}</DrawerTitle>
              </div>
              <DrawerDescription>
                {data.description || "Chưa có mô tả"}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <div
            className={"w-full flex flex-col justify-center items-start gap-3"}
          >
            <div className={"p-2"}>
              <p>Cài đặt nhóm</p>
            </div>
          </div>
          <DrawerFooter>
            <Button
              type={"button"}
              onClick={() => handleCreateInviteLink()}
              className={"hover:cursor-pointer"}
            >
              Tạo lời mời
            </Button>
            {amILeader === true || data.groupMembers.length != 1 ? (
              <Button
                type={"button"}
                variant={"destructive"}
                className={"hover:cursor-pointer"}
                onClick={() => handleQuitGroup()}
              >
                Rời khỏi nhóm
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type={"button"}
                    variant={"destructive"}
                    className={"hover:cursor-pointer"}
                  >
                    Xóa nhóm
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bạn chắc chứ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này không thể thu hồi
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Thoát</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        type={"button"}
                        variant={"destructive"}
                        className={"hover:cursor-pointer"}
                        onClick={() => handleDestroyGroup()}
                      >
                        Đồng ý
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
export default FamilySettingDrawer;
