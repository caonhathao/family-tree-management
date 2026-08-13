"use client";

import { LoaderModule } from "@/components/shared/loader-module";
import { ShowHideButton } from "@/components/shared/show-hide-button";
import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EnvConfig } from "@/lib/env/env-config.lib";
import {
  verifyGoogleAction,
  verifyPasswordAction,
} from "@/modules/auth/auth.actions";
import { VerifyPasswordSchema } from "@/modules/auth/auth.client-schemas";
import {
  IResponseLoginInfoDto,
  IVerifyPasswordDto,
} from "@/modules/auth/auth.dto";
import { IResponseLinkProvidersDto } from "@/modules/user/user.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { format, parseISO } from "date-fns";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { BsFillPeopleFill } from "react-icons/bs";
import { FaGoogle } from "react-icons/fa";
import { MdOutlineLogin } from "react-icons/md";
import { cn } from "@/lib/utils";

const ProviderIcon = ({ provider }: { provider: string | null }) => {
  switch (provider) {
    case "GOOGLE":
      return <FaGoogle />;
    case "USER":
      return <BsFillPeopleFill />;
    default:
      return null;
  }
};

const ProviderLabel = ({ provider }: { provider: string | null }) => {
  switch (provider) {
    case "GOOGLE":
      return "Google";
    case "USER":
      return "Email + mật khẩu";
    default:
      return "—";
  }
};

const ViewLoginInfo = ({
  providers,
}: {
  providers: IResponseLinkProvidersDto[];
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [step, setStep] = useState<"unlock" | "result">("unlock");
  const [info, setInfo] = useState<IResponseLoginInfoDto | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasPassword = providers.some((p) => p.provider === "USER");
  const hasGoogle = providers.some((p) => p.provider === "GOOGLE");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IVerifyPasswordDto>({
    resolver: zodResolver(VerifyPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const openDialog = () => {
    setOpen(true);
    setStep("unlock");
    setInfo(null);
    reset();
  };

  const onPasswordSubmit = (
    values: IVerifyPasswordDto,
    e?: React.BaseSyntheticEvent,
  ) => {
    e?.preventDefault();

    startTransition(async () => {
      const res = await verifyPasswordAction(values);

      if (res && "accounts" in res) {
        setInfo(res);
        setStep("result");
      } else {
        Toaster({
          title: "Xác thực thất bại",
          description: res.message,
          type: "error",
          cancel: { label: "OK", onClick: () => {} },
        });
      }
    });
  };

  const onGoogleSuccess = (token: string) => {
    startTransition(async () => {
      const res = await verifyGoogleAction({ token });

      if (res && "accounts" in res) {
        setInfo(res);
        setStep("result");
      } else {
        Toaster({
          title: "Xác thực thất bại",
          description: res.message,
          type: "error",
          cancel: { label: "OK", onClick: () => {} },
        });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? openDialog() : setOpen(false))}
    >
      <DialogTrigger asChild>
        <Button
          className={cn(
            "w-full h-10 flex flex-row justify-self-center border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base",
          )}
        >
          <MdOutlineLogin />
          Xem thông tin đăng nhập
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Thông tin đăng nhập</DialogTitle>
        <DialogDescription>
          {step === "unlock"
            ? "Xác thực lại để mở khóa thông tin đăng nhập của bạn."
            : "Danh sách tài khoản đăng nhập đã liên kết với tài khoản của bạn."}
        </DialogDescription>

        {step === "unlock" ? (
          <div className={"flex flex-col gap-3"}>
            {hasPassword && (
              <form onSubmit={handleSubmit(onPasswordSubmit)}>
                <FieldGroup>
                  <Field>
                    <div className={"flex flex-row gap-1"}>
                      <Input
                        id={"verify-password"}
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder={"Mật khẩu của bạn"}
                        required
                        {...register("password")}
                      />
                      <ShowHideButton
                        isPasswordVisible={isPasswordVisible}
                        setIsPasswordVisible={setIsPasswordVisible}
                      />
                    </div>
                    {errors.password && (
                      <span className={"text-xs text-red-500"}>
                        {errors.password.message}
                      </span>
                    )}
                  </Field>
                  <Field>
                    <Button
                      type={"submit"}
                      className={`hover:cursor-pointer border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base ${isPending ? "disabled" : ""}`}
                    >
                      {isPending ? (
                        <>
                          <LoaderModule scale={0.4} className={"w-1 h-1"} />{" "}
                          Đang xác thực
                        </>
                      ) : (
                        "Mở khóa"
                      )}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            )}
            {hasGoogle && (
              <GoogleOAuthProvider clientId={EnvConfig.googleClientId}>
                <div className={"flex flex-col items-center gap-2"}>
                  <span className={"text-xs text-muted-foreground"}>
                    Hoặc đăng nhập bằng Google để xác thực
                  </span>
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      onGoogleSuccess(credentialResponse.credential!);
                    }}
                    onError={() =>
                      Toaster({
                        title: "Xác thực thất bại",
                        description: "Đăng nhập Google thất bại",
                        type: "error",
                        cancel: { label: "OK", onClick: () => {} },
                      })
                    }
                  />
                </div>
              </GoogleOAuthProvider>
            )}
            {!hasPassword && !hasGoogle && (
              <p className={"text-sm text-muted-foreground"}>
                Không có phương thức đăng nhập nào để xác thực.
              </p>
            )}
          </div>
        ) : (
          <div className={"flex flex-col gap-3"}>
            {(info?.accounts ?? []).map((account) => (
              <div
                key={account.id}
                className={
                  "w-full flex flex-row items-center justify-between gap-3 rounded-md border px-4 py-3"
                }
              >
                <div className={"flex flex-row items-center gap-3"}>
                  <span className={"text-lg"}>
                    <ProviderIcon provider={account.provider} />
                  </span>
                  <div className={"flex flex-col"}>
                    <span className={"text-sm font-medium"}>
                      {account.email || "—"}
                    </span>
                    <span className={"text-xs text-muted-foreground"}>
                      {ProviderLabel({ provider: account.provider })}
                    </span>
                  </div>
                </div>
                <span className={"text-xs text-muted-foreground"}>
                  {account.createdAt
                    ? `Thêm ${format(
                        parseISO(String(account.createdAt)),
                        "dd/MM/yyyy",
                      )}`
                    : ""}
                </span>
              </div>
            ))}
            <div className={"flex justify-end gap-2"}>
              <Button
                type={"button"}
                variant={"outline"}
                className={
                  "hover:cursor-pointer border hover:shadow-sm active:scale-[0.98]"
                }
                onClick={() => setStep("unlock")}
              >
                Ẩn
              </Button>
              <Button
                type={"button"}
                className={
                  "hover:cursor-pointer border border-primary/20 hover:shadow-md active:scale-[0.98]"
                }
                onClick={() => setOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewLoginInfo;
