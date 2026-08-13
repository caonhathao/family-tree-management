"use client";

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
import { useState, useTransition } from "react";
import { MdAddLink } from "react-icons/md";
import { MdKeyboardArrowRight } from "react-icons/md";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { linkGoogleAction } from "@/modules/auth/auth.actions";
import { Toaster } from "@/components/shared/toast";
import { useRouter } from "next/navigation";
import { BaseForm } from "./base-auth";
import { cn } from "@/lib/utils";

const items = [
  { label: "Google", value: "GOOGLE" },
  { label: "Password", value: "USER" },
];

const AddNewAuthForm = ({ data }: { data: IResponseLinkProvidersDto[] }) => {
  const [provider, setProvider] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [move, setMove] = useState<boolean>(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const closeDialog = () => {
    setOpen(false);
    setProvider("");
    setMove(false);
  };

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
        <Button
          className={cn(
            "w-full h-full",
            "flex flex-row border text-sm hover:shadow-md active:scale-[0.98] sm:text-base",
          )}
          variant={"outline"}
        >
          <MdAddLink />
          Thêm mới
        </Button>
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
        ) : provider === "USER" ? (
          <BaseForm />
        ) : (
          <GoogleOAuthProvider clientId={EnvConfig.googleClientId}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                startTransition(async () => {
                  const res = await linkGoogleAction({
                    token: credentialResponse.credential!,
                  });

                  if (res && "success" in res && res.success === false) {
                    Toaster({
                      title: "Liên kết thất bại",
                      description: res.message,
                      type: "error",
                      cancel: {
                        label: "OK",
                        onClick: () => {},
                      },
                    });
                  } else {
                    Toaster({
                      title: "Liên kết thành công",
                      description: res?.message,
                      type: "success",
                      cancel: {
                        label: "OK",
                        onClick: () => {},
                      },
                    });
                    closeDialog();
                    router.refresh();
                  }
                });
              }}
              onError={() =>
                Toaster({
                  title: "Liên kết thất bại",
                  description: "Đăng nhập Google thất bại",
                  type: "error",
                  cancel: { label: "OK", onClick: () => {} },
                })
              }
            />
          </GoogleOAuthProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default AddNewAuthForm;
