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
import { Field } from "@/components/ui/field";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { updateGroupFamilyAction } from "@/modules/group-family/group-family.actions";
import {
  IUpdateGroupFamilyDto,
  ResponseGroupFamilyDetailDto,
} from "@/modules/group-family/group-family.dto";
import { UpdateGroupFamilySchema } from "@/modules/group-family/group-family.schemas";
import { RemoveFromGroupAction } from "@/modules/group-member/group-member.actions";
import { CreateInviteLinkAction } from "@/modules/invite/invite.actions";
import {
  ICreateInviteDto,
  IResponseCreateInviteDto,
} from "@/modules/invite/invite.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import isEqual from "lodash.isequal";
import { Controller, useForm } from "react-hook-form";
import { BsThreeDotsVertical } from "react-icons/bs";
import { CiLogout } from "react-icons/ci";
import { IoMdKey } from "react-icons/io";
import { IoSwapVertical } from "react-icons/io5";
import { MdOutlineInfo } from "react-icons/md";
import { TbEdit } from "react-icons/tb";

export const FamilyInfoDrawer = ({
  data,
}: {
  data: ResponseGroupFamilyDetailDto;
}) => {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IUpdateGroupFamilyDto>({
    resolver: zodResolver(UpdateGroupFamilySchema),
    defaultValues: {
      name: data.name || "",
      description: data.description || "",
    },
  });

  const onSubmit = async (
    values: IUpdateGroupFamilyDto,
    e?: React.BaseSyntheticEvent,
  ) => {
    e?.preventDefault();
    const origin = { name: data.name, description: data.description };

    if (isEqual(origin, values)) {
      Toaster({
        title: "Thông báo",
        description: "Không có thay đổi nào diễn ra",
        type: "info",
      });
    }
    const res = await updateGroupFamilyAction(data.id, values);
    // console.log(res);
    if (res && "error" in res) {
      Toaster({
        title: "Lỗi",
        description: res.error,
        type: "error",
      });
    } else {
      Toaster({
        title: "Thành công",
        description: "Cập nhật thành công",
        type: "success",
      });
    }
  };
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
      handleCopy(res.inviteLink);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const res = await RemoveFromGroupAction(data.id, memberId);
    // console.log(res);
  };

  return (
    <Drawer direction={"right"}>
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
          <form
            onSubmit={handleSubmit(onSubmit)}
            className={"flex flex-row justify-between items-center w-full"}
          >
            <div className={"w-full"}>
              <DrawerTitle>
                <Field>
                  <Controller
                    name={"name"}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        className={
                          "text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 -ml-1 w-full"
                        }
                        placeholder={"Nhập tên nhóm..."}
                      />
                    )}
                  />
                  {errors.name && (
                    <span className={"text-xs text-red-500"}>
                      {errors.name.message}
                    </span>
                  )}
                </Field>
              </DrawerTitle>
              <DrawerDescription>
                <Field>
                  <Controller
                    name={"description"}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        className={
                          "text-sm text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 -ml-1 w-full resize-none"
                        }
                        placeholder={"Thêm mô tả ngắn gọn..."}
                      />
                    )}
                  />
                  {errors.description && (
                    <span className={"text-xs text-red-500"}>
                      {errors.description.message}
                    </span>
                  )}
                </Field>
              </DrawerDescription>
            </div>
            <Button
              type={"submit"}
              variant={"outline"}
              size={"icon"}
              className={"hover:cursor-pointer"}
            >
              <TbEdit />
            </Button>
          </form>
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
                      <DropdownMenuItem
                        className={"hover:cursor-pointer"}
                        onClick={() =>
                          handleRemoveMember(item.member.userProfile.userId)
                        }
                      >
                        <CiLogout />
                        Rời nhóm
                      </DropdownMenuItem>
                      <DropdownMenuItem className={"hover:cursor-pointer"}>
                        <MdOutlineInfo />
                        Thông tin
                      </DropdownMenuItem>
                      <DropdownMenuItem className={"hover:cursor-pointer"}>
                        <IoSwapVertical />
                        Đổi vai trò
                      </DropdownMenuItem>
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
          <DrawerClose asChild>
            <Button variant={"outline"}>Thoát</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
