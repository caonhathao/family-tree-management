import { cn } from "@/lib/utils";
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
import { startTransition, useState, useTransition } from "react";
import { ShowHideButton } from "@/components/shared/show-hide-button";
import { loginBaseAction } from "@/modules/auth/auth.actions";
import { LoginBaseDto, RegisterDto } from "@/modules/auth/auth.dto";
import { LoginSchema } from "@/modules/auth/auth.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();

  const navigateToRegister = () => {
    router.push("/auth?mode=register");
  };
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBaseDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginBaseDto) => {
    startTransition(() => {
      loginBaseAction(values);
    });
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Đăng nhập vào tài khoản</CardTitle>
          <CardDescription>
            Điền thông tin dăng nhập vào bên dưới để tiếp tục
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email của bạn"
                  autoComplete="email"
                  required
                  {...register("email")}
                />
                {errors.email && (
                  <span className="text-xs text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </Field>
              <Field>
                <div className="flex flex-row gap-1">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Mật khẩu của bạn"
                    required
                    {...register("password")}
                  />
                  <ShowHideButton
                    isPasswordVisible={isPasswordVisible}
                    setIsPasswordVisible={setIsPasswordVisible}
                  />
                </div>
                {errors.password && (
                  <span className="text-xs text-red-500">
                    {errors.password.message}
                  </span>
                )}
                <div className="flex items-center">
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                <Button variant="outline" type="button">
                  Đăng nhập với Google
                </Button>
                <FieldDescription className="text-center">
                  Không có tài khoản?
                  <Button
                    variant={"link"}
                    className="hover:cursor-pointer p-1"
                    onClick={() => navigateToRegister()}
                  >
                    Đăng kí ngay
                  </Button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
