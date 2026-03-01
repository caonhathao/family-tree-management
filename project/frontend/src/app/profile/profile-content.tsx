"use client";
import { AppDispatch, RootState } from "@/store";
import { useSelector } from "react-redux";
import unknownImage from "../../../public/img/unknow.png";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FaExchangeAlt } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { UpdateUserForm } from "./components/forms/update-user";
import { useEffect, useMemo } from "react";
import { IResponseUserDto, IUserInfoDto } from "@/modules/user/user.dto";
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
    if (data && !("error" in data)) dispatch(setProfile(data as IUserInfoDto));
  }, [data, dispatch]);

  const avatar = useMemo(() => {
    if (data && !("error" in data) && data.userProfile.avatar) {
      return data.userProfile.avatar;
    } else {
      return unknownImage.src;
    }
  }, [data]);

  return (
    <div className={"w-full h-full p-3"}>
      <div
        className={
          "w-full h-full flex flex-row justify-center items-center gap-3"
        }
      >
        <div className={"w-[40%] flex justify-end"}>
          <div className={"rounded-lg border w-fit p-0.5 relative"}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"outline"}
                  size={"icon-lg"}
                  className={"absolute top-0 right-0 hover:cursor-pointer"}
                >
                  <FaExchangeAlt />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Đổi ảnh</TooltipContent>
            </Tooltip>
            <Image src={avatar} width={200} height={200} alt={"avatar"} />
          </div>
        </div>
        <div className={"w-[60%] h-full flex flex-col items-start"}>
          <UpdateUserForm className={"w-[50%]"} />
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;
