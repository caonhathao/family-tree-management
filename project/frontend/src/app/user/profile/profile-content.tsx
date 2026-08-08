"use client";
import { AppDispatch } from "@/store";
import Image from "next/image";
import unknownImage from "../../../../public/img/unknow.webp";
import { Button } from "@/components/ui/button";
import { FaExchangeAlt } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UpdateUserForm from "./components/forms/update-user";
import { useEffect, useMemo } from "react";
import { IResponseUserDto } from "@/modules/user/user.dto";
import { useDispatch } from "react-redux";
import { setProfile } from "@/store/user/userSlice";
import { useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigate.utils";
import { Separator } from "@/components/ui/separator";
import { FaArrowRight } from "react-icons/fa6";
import { ApiResponse } from "@/types/api.types";

const ProfileContent = ({
  data,
}: {
  data: IResponseUserDto | ApiResponse<IResponseUserDto, unknown>;
}) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (data && "userProfile" in data) {
      const serializableProfile = {
        ...data,
        userProfile: {
          ...data.userProfile,
          dateOfBirth: data.userProfile.dateOfBirth,
        },
      };

      dispatch(setProfile(serializableProfile));
    }
    console.log("Data at profile content:", data);
  }, [data, dispatch]);

  const avatar = useMemo(() => {
    if (data && "userProfile" in data && data.userProfile.avatar) {
      return data.userProfile.avatar;
    } else {
      return unknownImage.src;
    }
  }, [data]);

  const availableData = useMemo(() => {
    if (data && !("error" in data)) {
      return data;
    } else return null;
  }, [data]);

  const router = useRouter();

  if (!availableData) {
    return (
      <div className={"w-full h-full flex justify-center items-center"}>
        Tải dữ liệu thất bại.
      </div>
    );
  }
  return (
    <div
      className={
        "w-full h-full flex flex-col gap-3 py-5 md:p-5 lg:px-20 lg:py-10"
      }
    >
      {/* display avatar and profile */}
      <div
        className={
          "w-full flex flex-col justify-center items-center md:flex-row md:items-start gap-5 py-5"
        }
      >
        <div
          className={
            "rounded-lg h-60 lg:h-80 border aspect-square relative shadow"
          }
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"outline"}
                size={"icon-sm"}
                className={
                  "absolute top-0 right-0 z-10 hover:cursor-pointer border hover:shadow-md active:scale-[0.98]"
                }
              >
                <FaExchangeAlt />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Đổi ảnh</TooltipContent>
          </Tooltip>
          <Image
            src={avatar}
            sizes={"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 30vw"}
            fill
            alt={"avatar"}
            className={"rounded-lg"}
          />
        </div>
        {/* display profile */}
        <div className={"w-full flex flex-col gap-3 p-3"}>
          <h2 className={"font-bold"}>Thông tin chung</h2>
          <UpdateUserForm
            className={"w-full bg-background"}
            data={availableData}
          />
        </div>
      </div>
      <Separator />
      <div
        className={
          "w-full md:w-fit h-full flex flex-col items-start justify-center"
        }
      >
        {/* display others */}
        <div className={"w-full flex flex-col gap-3 py-5"}>
          {/* Showing some infomation about groups, invites, chats,... */}
          <div className={" p-3 flex flex-col"}>
            <strong>Tóm tắt hoạt động</strong>
            <div>
              Số nhóm hiện có:{" "}
              {availableData && "groups" in availableData
                ? availableData.groups
                : 0}
              <Button
                variant={"link"}
                size={"sm"}
                className={"hover:cursor-pointer text-sm sm:text-base"}
                onClick={() =>
                  navigateTo({
                    router: router,
                    url: "/user/groups",
                  })
                }
              >
                Xem chi tiết
              </Button>
            </div>
            <div>
              Số lời mời hiện có:{" "}
              {availableData && "invites" in availableData
                ? availableData.invites
                : 0}
            </div>
            <div>Số cuộc trò chuyện hiện có: (in progress)</div>
          </div>
          <Separator />
          <div className={" p-3 flex flex-col"}>
            <p>
              <strong>Dung lượng lưu trữ</strong>
            </p>
          </div>
        </div>
      </div>
      <Separator />
      <div
        className={
          "w-full md:w-fit h-full flex flex-col items-start justify-center p-3"
        }
      >
        <h2 className={"font-bold"}>Bảo mật</h2>
        <div className={"flex flex-col justify-center items-start gap-3"}>
          <div className={"flex flex-row justify-center items-start gap-3"}>
            <p className={"py-1"}>Xem thêm về thông tin đăng nhập</p>
            <Button
              variant={"outline"}
              className={"border hover:shadow-md active:scale-[0.98]"}
            >
              <FaArrowRight />
            </Button>
          </div>
          <div className={"flex flex-row justify-center items-start gap-3"}>
            <p className={"py-1"}>Xóa tài khoản:</p>
            <Button
              variant={"destructive"}
              className={
                "border border-destructive/20 hover:shadow-md active:scale-[0.98]"
              }
            >
              <FaArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;
