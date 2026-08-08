import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IResponseLinkProvidersDto } from "@/modules/user/user.dto";
import { useState } from "react";
import { MdAddLink } from "react-icons/md";
import { MdKeyboardArrowRight } from "react-icons/md";
import { BaseForm } from "./base-auth";

const items = [
  { label: "Google", value: "GOOGLE" },
  { label: "Password", value: "USER" },
];

const AddNewAuthForm = ({ data }: { data: IResponseLinkProvidersDto[] }) => {
  const [provider, setProvider] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [move, setMove] = useState<boolean>(false);

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        setOpen(!open);
        setProvider("");
        setMove(false);
      }}
    >
      <DialogTrigger asChild>
        <div className={"w-full flex flex-row justify-start items-center"}>
          <Button
            className={
              "w-3/5 flex flex-row border text-sm hover:shadow-md active:scale-[0.98] sm:text-base"
            }
            variant={"outline"}
          >
            <MdAddLink />
            Thêm mới
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Thêm phương thức xác thực mới</DialogTitle>
        <DialogDescription>
          Vui lòng chọn từ danh sách bên dưới để tiến hành tạo phương thức xác
          thực mới
        </DialogDescription>
        {!move ? (
          <div
            className={
              "w-full flex flex-row justify-between items-center gap-3"
            }
          >
            <Select onValueChange={(e) => setProvider(e)}>
              <SelectTrigger className={"w-45"}>
                <SelectValue placeholder={"Phương thức"} />
              </SelectTrigger>
              <SelectContent align={"start"}>
                <SelectGroup>
                  {items.map((item) => {
                    const isPicked = data.find(
                      (i) => i.provider === item.value,
                    );

                    return (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        disabled={!!isPicked}
                      >
                        {item.label}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            {provider != "" ? (
              <Button
                variant={"outline"}
                className={"border hover:shadow-md active:scale-[0.98]"}
                onClick={() => setMove(true)}
              >
                <MdKeyboardArrowRight />
              </Button>
            ) : null}
          </div>
        ) : (
          <BaseForm />
        )}
      </DialogContent>
    </Dialog>
  );
};
export default AddNewAuthForm;
