"use client";
import { AppDispatch } from "@/store";
import Image from "next/image";
import unknownImage from "../../../../public/img/unknow.png";
import { Button } from "@/components/ui/button";
import { FaExchangeAlt } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UpdateUserForm } from "./components/forms/update-user";
import { useEffect, useMemo } from "react";
import { IResponseUserDto } from "@/modules/user/user.dto";
import { IErrorResponse } from "@/types/base.types";
import { useDispatch } from "react-redux";
import { setProfile } from "@/store/user/userSlice";

const ProfileContent = ({
  data,
}: {
  data: IResponseUserDto | IErrorResponse | null;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (data && !("error" in data)) {
      const serializableProfile = {
        ...data,
        userProfile: {
          ...data.userProfile,
          dateOfBirth: data.userProfile.dateOfBirth,
        },
      };

      dispatch(setProfile(serializableProfile));
    }
  }, [data, dispatch]);

  const avatar = useMemo(() => {
    if (data && !("error" in data) && data.userProfile.avatar) {
      return data.userProfile.avatar;
    } else {
      return unknownImage.src;
    }
  }, [data]);

  return (
    <div className={"w-full h-full p-3 flex flex-row gap-3"}>
      <div className={"w-[40%] flex flex-col justify-center items-start gap-5"}>
        <div className={"w-full flex justify-center items-center"}>
          <div className={"rounded-lg border w-fit p-0.5 relative"}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"outline"}
                  size={"icon-sm"}
                  className={"absolute top-0 right-0 hover:cursor-pointer"}
                >
                  <FaExchangeAlt />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Đổi ảnh</TooltipContent>
            </Tooltip>
            <Image src={avatar} width={100} height={100} alt={"avatar"} />
          </div>
        </div>
        <div className={"w-full h-full flex flex-col items-start"}>
          <UpdateUserForm className={"w-full border rounded-lg p-3 shadow"} />
        </div>
      </div>
      <div className={"w-[60%] flex flex-col gap-3"}>
        {/* Showing some infomation about groups, invites, chats,... */}
        <div className={"border shadow rounded-lg p-3"}>
          <p>
            <strong>Thông tin chung</strong>
          </p>
          <p>Số nhóm hiện có: </p>
          <p>Số lời mời hiện có: </p>
          <p>Số cuộc trò chuyện hiện có: </p>
        </div>
        <div className={"border shadow rounded-lg p-3"}>
          <p>
            <strong>Dung lượng lưu trữ</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;
