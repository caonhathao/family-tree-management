"use client";
import { LoaderModule } from "@/components/shared/loader-module";
import { Toaster } from "@/components/shared/toast";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UpdateUserInfoAction } from "@/modules/user/user.actions";
import { UserSchema } from "@/modules/user/user.client-schemas";
import { IResponseUserDto, IUserInfoDto } from "@/modules/user/user.dto";
import { AppDispatch, RootState } from "@/store";
import { setProfile } from "@/store/user/userSlice";
import { IErrorResponse } from "@/types/base.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export const UpdateUserForm = ({ className }: { className: string }) => {
  const { profile } = useSelector((state: RootState) => state.user);

  type UserFormValues = z.input<typeof UserSchema>;
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      fullName: profile.userProfile.fullName || "",
    },
  });

  const [isLoading, startTransition] = useTransition();
  const [date, setDate] = useState<Date | undefined>(
    profile.userProfile.dateOfBirth
      ? new Date(profile.userProfile.dateOfBirth)
      : undefined,
  );
  const [bio, setBio] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();

  const onSubmit = (values: UserFormValues, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    console.log(values);
    startTransition(async () => {
      const res: IResponseUserDto | IErrorResponse = await UpdateUserInfoAction(
        profile.id,
        values as IUserInfoDto,
      );

      if (res && "error" in res) {
        Toaster({
          title: "Hành động thất bại",
          description: res.error,
          type: "error",
          cancel: {
            label: "OK",
            onClick: () => {},
          },
        });
      } else {
        Toaster({
          title: "Hành động thành công",
          description: "Cập nhật thông tin thành công.",
          type: "success",
          cancel: {
            label: "OK",
            onClick: () => {},
          },
        });
      }
      dispatch(setProfile(res as IResponseUserDto));
    });
  };
  useEffect(() => {
    if (profile?.userProfile) {
      reset({
        fullName: profile.userProfile.fullName || "",
      });
    }
  }, [profile, reset]);

  if (!profile) return <LoaderModule />;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={"fullName"}>Tên của bạn là:</FieldLabel>
            <Input
              id={"fullName"}
              type={"text"}
              required
              {...register("fullName")}
            />
            {errors.fullName && (
              <span className={"text-xs text-red-500"}>
                {errors.fullName.message}
              </span>
            )}
          </Field>
          <Field className={"w-full"}>
            <FieldLabel htmlFor={"date"}>Sinh nhật của bạn là:</FieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  id={"date"}
                  className={"justify-start font-normal hover:cursor-pointer"}
                >
                  {date ? date.toLocaleDateString() : "Ngày nào nè?"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className={"w-auto overflow-hidden p-0"}
                align={"start"}
              >
                <Calendar
                  mode={"single"}
                  selected={date}
                  defaultMonth={date}
                  captionLayout={"dropdown"}
                  onSelect={(date) => {
                    setDate(date);
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};
