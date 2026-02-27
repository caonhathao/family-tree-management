import { ShowHideButton } from "@/components/shared/show-hide-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IRegisterDto } from "@/modules/auth/auth.dto";
import { registerAction } from "@/modules/auth/auth.actions";
import { RegisterSchema } from "@/modules/auth/auth.client-schemas";
import { Toaster } from "@/components/shared/toast";
import { IErrorResponse, ISuccessResponse } from "@/types/base.types";
import { cn } from "@/lib/util/utils";

interface SignupFormProps extends React.ComponentProps<typeof Card> {
  callback?: string;
}
export function SignupForm({ className, callback, ...props }: SignupFormProps) {
  const router = useRouter();
  const navigateToLogin = () => {
    router.push("/auth?mode=login");
  };
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IRegisterDto>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: IRegisterDto, e?: React.BaseSyntheticEvent) => {
    // console.log(values);
    e?.preventDefault();
    startTransition(async () => {
      const result: ISuccessResponse | IErrorResponse | undefined =
        await registerAction(values);
      if (result) {
        if (result.success == false && "error" in result) {
          Toaster({
            title: "Đăng kí thất bại",
            description: result.error,
            type: "error",
            cancel: {
              label: "OK",
              onClick: () => {},
            },
          });
        } else if (result.success == true && "message" in result) {
          Toaster({
            title: "Đăng kí thành công",
            description: result.message,
            type: "success",
            cancel: {
              label: "OK",
              onClick: () => {},
            },
          });
          router.push(callback || "/");
        }
      }
    });
  };

  return (
    <Card {...props} className={cn("border-none shadow-none", className)}>
      <CardHeader>
        <CardTitle>Tạo tài khoản</CardTitle>
        <CardDescription>
          Nhập thông tin vào bên dưới để tạo tài khoản mới
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldGroup className={"flex flex-row"}>
              <Field>
                <Input
                  id={"name"}
                  type={"text"}
                  placeholder={"Tên của bạn"}
                  disabled={isPending}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <span className={"text-xs text-red-500"}>
                    {errors.fullName.message}
                  </span>
                )}
              </Field>
              <Field>
                <Input
                  id={"email"}
                  type={"email"}
                  placeholder={"Email của bạn"}
                  autoComplete={"email"}
                  disabled={isPending}
                  {...register("email")}
                />
                {errors.email && (
                  <span className={"text-xs text-red-500"}>
                    {errors.email.message}
                  </span>
                )}
              </Field>
            </FieldGroup>
            <Field>
              <div className={"flex flex-row gap-1"}>
                <Input
                  id={"password"}
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder={"Mật khẩu của bạn"}
                  autoComplete={"new-password"}
                  disabled={isPending}
                  {...register("password")}
                />
                <ShowHideButton
                  isPasswordVisible={isPasswordVisible}
                  setIsPasswordVisible={setIsPasswordVisible}
                />
              </div>
              {errors.password ? (
                <span className={"text-xs text-red-500"}>
                  {errors.password.message}
                </span>
              ) : (
                <FieldDescription>
                  Mật khẩu phải có ít nhất 8 kí tự.
                </FieldDescription>
              )}
            </Field>
            <Field>
              <Input
                id={"confirm-password"}
                type={"password"}
                placeholder={"Xác nhận mật khẩu"}
                autoComplete={"new-password"}
                disabled={isPending}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <span className={"text-xs text-red-500"}>
                  {errors.confirmPassword.message}
                </span>
              ) : (
                <FieldDescription>Vui lòng nhập lại mật khẩu</FieldDescription>
              )}
            </Field>
            <FieldGroup>
              <Field>
                <Button
                  type={"submit"}
                  className={"hover:cursor-pointer"}
                  disabled={isPending}
                >
                  Tạo tài khoản
                </Button>
                <Button
                  variant={"outline"}
                  type={"button"}
                  className={"hover:cursor-pointer"}
                >
                  Đăng kí với Google
                </Button>
                <FieldDescription className={"px-6 text-center "}>
                  Đã có tài khoản?
                  <Button
                    type={"button"}
                    variant={"link"}
                    className={"hover:cursor-pointer p-1"}
                    onClick={() => navigateToLogin()}
                  >
                    Đăng nhập ngay
                  </Button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
