"use client";

import { LoaderModule } from "@/components/shared/loader-module";
import { ShowHideButton } from "@/components/shared/show-hide-button";
import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "@/modules/auth/auth.actions";
import { ChangePasswordSchema } from "@/modules/auth/auth.client-schemas";
import { IChangePasswordDto } from "@/modules/auth/auth.dto";
import { ApiResponse } from "@/types/api.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

export const ChangePasswordForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IChangePasswordDto>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (
    values: IChangePasswordDto,
    e?: React.BaseSyntheticEvent,
  ) => {
    e?.preventDefault();

    startTransition(async () => {
      const result: ApiResponse<unknown> | undefined =
        await changePasswordAction(values);

      if (result) {
        if (result.success == false) {
          Toaster({
            title: "Đổi mật khẩu thất bại",
            description: result.message,
            type: "error",
            cancel: {
              label: "OK",
              onClick: () => {},
            },
          });
        } else {
          reset();
          Toaster({
            title: "Đổi mật khẩu thành công",
            description: result.message,
            type: "success",
            cancel: {
              label: "OK",
              onClick: () => {},
            },
          });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <div className={"flex flex-row gap-1"}>
            <Input
              id={"old-password"}
              type={isPasswordVisible ? "text" : "password"}
              placeholder={"Mật khẩu hiện tại"}
              required
              {...register("oldPassword")}
            />
            <ShowHideButton
              isPasswordVisible={isPasswordVisible}
              setIsPasswordVisible={setIsPasswordVisible}
            />
          </div>
          {errors.oldPassword && (
            <span className={"text-xs text-red-500"}>
              {errors.oldPassword.message}
            </span>
          )}
        </Field>
        <Field>
          <div className={"flex flex-row gap-1"}>
            <Input
              id={"new-password"}
              type={isPasswordVisible ? "text" : "password"}
              placeholder={"Mật khẩu mới"}
              required
              {...register("newPassword")}
            />
          </div>
          {errors.newPassword && (
            <span className={"text-xs text-red-500"}>
              {errors.newPassword.message}
            </span>
          )}
        </Field>
        <Field>
          <div className={"flex flex-row gap-1"}>
            <Input
              id={"confirm-password"}
              type={isPasswordVisible ? "text" : "password"}
              placeholder={"Xác nhận mật khẩu mới"}
              required
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <span className={"text-xs text-red-500"}>
              {errors.confirmPassword.message}
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
                <LoaderModule scale={0.4} className={"w-1 h-1"} /> Đang lưu
              </>
            ) : (
              "Xác nhận"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
};
