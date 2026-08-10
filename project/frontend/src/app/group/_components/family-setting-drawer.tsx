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
    if (res && "errors" in res) {
      Toaster({
        title: "Lỗi",
        description: res.message,
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
          <Button
            variant={"outline"}
            size={"icon-lg"}
            className={"border hover:shadow-md active:scale-[0.98]"}
          >
            <MdOutlineSettings />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <div className={"w-full flex flex-col gap-1"}>
              <div className={"relative w-full flex flex-row justify-between"}>
                <DrawerTitle className={"text-base sm:text-lg lg:text-xl"}>
                  {data.name || "Nhóm gia đình"}
                </DrawerTitle>
              </div>
              <DrawerDescription className={"text-sm sm:text-base"}>
                {data.description || "Chưa có mô tả"}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <div
            className={"w-full flex flex-col justify-center items-start gap-3"}
          >
            <div className={"p-2"}>
              <p className={"text-sm font-semibold sm:text-base lg:text-lg"}>
                Cài đặt nhóm
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button
              type={"button"}
              onClick={() => handleCreateInviteLink()}
              className={
                "hover:cursor-pointer border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base"
              }
            >
              Tạo lời mời
            </Button>
            {amILeader ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type={"button"}
                    variant={"destructive"}
                    className={
                      "hover:cursor-pointer border border-destructive/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base"
                    }
                  >
                    Xóa nhóm
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle
                      className={"text-base sm:text-lg lg:text-xl"}
                    >
                      Bạn chắc chứ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className={"text-sm sm:text-base"}>
                      Hành động này không thể thu hồi
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Thoát</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        type={"button"}
                        variant={"destructive"}
                        className={
                          "hover:cursor-pointer border border-destructive/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base"
                        }
                        onClick={() => handleDestroyGroup()}
                      >
                        Đồng ý
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                type={"button"}
                variant={"destructive"}
                className={
                  "hover:cursor-pointer border border-destructive/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base"
                }
                onClick={() => handleQuitGroup()}
              >
                Rời khỏi nhóm
              </Button>
            )}
            <DrawerClose asChild>
              <Button
                variant={"outline"}
                className={
                  "hover:cursor-pointer text-sm hover:shadow-sm active:scale-[0.98] sm:text-base"
                }
              >
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
