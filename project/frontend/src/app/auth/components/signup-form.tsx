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
import { RegisterDto } from "@/modules/auth/auth.dto";
import { registerAction } from "@/modules/auth/auth.actions";
import { RegisterSchema } from "@/modules/auth/auth.schemas";
import { Toaster } from "@/components/shared/toast";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
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
  } = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterDto, e?: React.BaseSyntheticEvent) => {
    // console.log(values);
    e?.preventDefault();
    startTransition(async () => {
      const result = await registerAction(values);
      if (result?.error) {
        Toaster({
          title: "Đăng kí thất bại",
          description: result.error,
          type: "error",
        });
      }
    });
  };

  return (
    <Card {...props} className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Tạo tài khoản</CardTitle>
        <CardDescription>
          Nhập thông tin vào bên dưới để tạo tài khoản mới
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldGroup className="flex flex-row">
              <Field>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tên của bạn"
                  disabled={isPending}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <span className="text-xs text-red-500">
                    {errors.fullName.message}
                  </span>
                )}
              </Field>
              <Field>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email của bạn"
                  autoComplete="email"
                  disabled={isPending}
                  {...register("email")}
                />
                {errors.email && (
                  <span className="text-xs text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </Field>
            </FieldGroup>
            <Field>
              <div className="flex flex-row gap-1">
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder="Mật khẩu của bạn"
                  autoComplete="new-password"
                  disabled={isPending}
                  {...register("password")}
                />
                <ShowHideButton
                  isPasswordVisible={isPasswordVisible}
                  setIsPasswordVisible={setIsPasswordVisible}
                />
              </div>
              {errors.password ? (
                <span className="text-xs text-red-500">
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
                id="confirm-password"
                type="password"
                placeholder="Xác nhận mật khẩu"
                autoComplete="new-password"
                disabled={isPending}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <span className="text-xs text-red-500">
                  {errors.confirmPassword.message}
                </span>
              ) : (
                <FieldDescription>Vui lòng nhập lại mật khẩu</FieldDescription>
              )}
            </Field>
            <FieldGroup>
              <Field>
                <Button
                  type="submit"
                  className="hover:cursor-pointer"
                  disabled={isPending}
                >
                  Tạo tài khoản
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="hover:cursor-pointer"
                >
                  Đăng kí với Google
                </Button>
                <FieldDescription className="px-6 text-center ">
                  Đã có tài khoản?
                  <Button
                    type="button"
                    variant={"link"}
                    className="hover:cursor-pointer p-1"
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
