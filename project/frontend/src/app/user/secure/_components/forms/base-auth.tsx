"use client";

import { LoaderModule } from "@/components/shared/loader-module";
import { ShowHideButton } from "@/components/shared/show-hide-button";
import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createNewBaseAuth } from "@/modules/auth/auth.actions";
import { NewBaseAuthSchema } from "@/modules/auth/auth.client-schemas";
import { INewBaseAuth } from "@/modules/auth/auth.dto";
import { ISuccessResponse } from "@/types/base.types";
import { ApiResponse } from "@/types/api.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

export const BaseForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<INewBaseAuth>({
    resolver: zodResolver(NewBaseAuthSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: INewBaseAuth, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();

    if (values.confirmPassword !== values.password) {
      Toaster({
        title: "Khởi tạo thất bại",
        description: "Mật khẩu không khớp",
        type: "warning",
        cancel: {
          label: "OK",
          onClick: () => {},
        },
      });
      return;
    }

    startTransition(async () => {
      const result: ISuccessResponse | ApiResponse<never, unknown> | undefined =
        await createNewBaseAuth(values);
      // console.log(result);

      if (result) {
        if (result.success == false) {
          Toaster({
            title: "Khởi tạo thất bại",
            description: result.message,
            type: "error",
            cancel: {
              label: "OK",
              onClick: () => {},
            },
          });
        } else if (result.success == true) {
          Toaster({
            title: "Khởi tạo thành công",
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
              id={"password"}
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
          <div className={"flex flex-row gap-1"}>
            <Input
              id={"confirm-password"}
              type={isPasswordVisible ? "text" : "password"}
              placeholder={"Xác nhận lại mật khẩu"}
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
                <LoaderModule scale={0.4} className={"w-1 h-1"} /> Đang khởi tạo
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
