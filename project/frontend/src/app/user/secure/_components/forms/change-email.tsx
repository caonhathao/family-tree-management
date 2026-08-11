"use client";

import { LoaderModule } from "@/components/shared/loader-module";
import { ShowHideButton } from "@/components/shared/show-hide-button";
import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changeEmailAction } from "@/modules/auth/auth.actions";
import { ChangeEmailSchema } from "@/modules/auth/auth.client-schemas";
import { IChangeEmailDto } from "@/modules/auth/auth.dto";
import { ApiResponse } from "@/types/api.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

export const ChangeEmailForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IChangeEmailDto>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: {
      newEmail: "",
      password: "",
    },
  });

  const onSubmit = (values: IChangeEmailDto, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();

    startTransition(async () => {
      const result: ApiResponse<unknown> | undefined =
        await changeEmailAction(values);

      if (result) {
        if (result.success == false) {
          Toaster({
            title: "Đổi email thất bại",
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
            title: "Đổi email thành công",
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
          <Input
            id={"new-email"}
            type={"email"}
            placeholder={"Email mới"}
            required
            {...register("newEmail")}
          />
          {errors.newEmail && (
            <span className={"text-xs text-red-500"}>
              {errors.newEmail.message}
            </span>
          )}
        </Field>
        <Field>
          <div className={"flex flex-row gap-1"}>
            <Input
              id={"password"}
              type={isPasswordVisible ? "text" : "password"}
              placeholder={"Mật khẩu hiện tại"}
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
