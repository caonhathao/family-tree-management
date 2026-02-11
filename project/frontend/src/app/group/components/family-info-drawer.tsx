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
import { ResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { BsThreeDotsVertical } from "react-icons/bs";
import { CiLogout } from "react-icons/ci";
import { IoSwapVertical } from "react-icons/io5";
import { MdOutlineInfo } from "react-icons/md";

export const FamilyInfoDrawer = ({
  data,
}: {
  data: ResponseGroupFamilyDetailDto;
}) => {
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
          <DrawerTitle>{data.name}</DrawerTitle>
          <DrawerDescription>{data.description}</DrawerDescription>
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
              <div className={"col-span-4"}>
                {item.member.userProfile.fullName}
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
                      <DropdownMenuItem className={"hover:cursor-pointer"}>
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
          <Button>Tạo lời mời</Button>
          <DrawerClose asChild>
            <Button variant={"outline"}>Thoát</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
