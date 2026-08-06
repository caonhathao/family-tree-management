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
import { AppDispatch } from "@/store";
import { setProfile } from "@/store/user/userSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import z from "zod";
import { Button } from "@/components/ui/button";
import BioUserGroup from "./bio-user";
import { safeJsonParse } from "@/lib/utils/funcs.utils";
import { LuLoaderCircle } from "react-icons/lu";
import { ApiResponse } from "@/types/api.types";

interface IUserFormProps {
  className: string;
  data: IResponseUserDto | ApiResponse<IResponseUserDto, unknown>;
}

const UpdateUserForm = ({ className, data }: IUserFormProps) => {
  type UserFormValues = z.input<typeof UserSchema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      fullName: data && "userProfile" in data ? data.userProfile.fullName : "",
      memorableName:
        data && "userProfile" in data ? data.userProfile.memorableName : "",
      address: data && "userProfile" in data ? data.userProfile.address : "",
    },
  });

  const [isLoading, startTransition] = useTransition();
  const [dateOverride, setDateOverride] = useState<Date | undefined>(undefined);
  const [bioOverride, setBioOverride] = useState<
    Record<string, string>[] | null
  >(null);

  const date = useMemo(() => {
    if (!data) return undefined;

    return (
      dateOverride ??
      (data && "userProfile" in data && data.userProfile.dateOfBirth
        ? new Date(data.userProfile.dateOfBirth)
        : undefined)
    );
  }, [dateOverride, data]);

  const bio = useMemo(() => {
    if (!data) return undefined;
    return (
      bioOverride ??
      (safeJsonParse(
        data && "userProfile" in data ? data.userProfile.biography : null,
      ) ||
        [])
    );
  }, [bioOverride, data]);

  const [open, setOpen] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();

  const onSubmit = (values: UserFormValues, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    console.log(values);

    const payload: IUserInfoDto = {
      fullName: values.fullName,
      dateOfBirth: date?.toString() || "",
      biography: JSON.stringify(bio) || "",
    };

    //prepare data before update
    startTransition(async () => {
      if (data && "id" in data) {
        const res: IResponseUserDto | ApiResponse<IResponseUserDto, unknown> =
          await UpdateUserInfoAction(data.id, payload);

        if (res && "errors" in res) {
          Toaster({
            title: "Hành động thất bại",
            description: res.message,
            type: "error",
            cancel: {
              label: "OK",
              onClick: () => {},
            },
          });
        } else if ("userProfile" in res) {
          Toaster({
            title: "Hành động thành công",
            description: "Cập nhật thông tin thành công.",
            type: "success",
            cancel: {
              label: "OK",
              onClick: () => {},
            },
          });
          const serializableProfile = {
            ...res,
            userProfile: {
              ...res.userProfile,
              dateOfBirth: res.userProfile.dateOfBirth,
            },
          };

          dispatch(setProfile(serializableProfile));
          setDateOverride(undefined);
          setBioOverride(null);
        }
      } else {
        Toaster({
          title: "Failed to update",
          description: "Error has occurred! Please try again!",
          cancel: {
            label: "OK",
            onClick: () => {},
          },
          duration: 2000,
          type: "error",
        });
      }
    });
  };
  useEffect(() => {
    if (data && "userProfile" in data) {
      reset({
        fullName: data.userProfile.fullName || "",
      });
    }
    console.log("data at update form:", data);
  }, [data, reset]);

  useEffect(() => {
    console.log(bio);
  }, [bio]);

  if (!data) return <LoaderModule />;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className={"flex flex-col gap-5"}>
        <FieldGroup
          className={
            "grid grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1 gap-5"
          }
        >
          <Field>
            <FieldLabel htmlFor={"fullName"}>Tên của bạn là:</FieldLabel>
            <Input
              id={"fullName"}
              type={"text"}
              required
              {...register("fullName")}
              defaultValue={
                data && "userProfile" in data ? data.userProfile.fullName : ""
              }
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
                  onSelect={(selectedDate) => {
                    setDateOverride(selectedDate);
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </Field>
        </FieldGroup>
        <FieldGroup
          className={
            "grid grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1 gap-5"
          }
        >
          <Field>
            <FieldLabel htmlFor={"memorableName"}>Tên gợi nhớ là:</FieldLabel>
            <Input
              id={"memorableName"}
              type={"text"}
              required
              {...register("memorableName")}
            />
            {errors.memorableName && (
              <span className={"text-xs text-red-500"}>
                {errors.memorableName.message}
              </span>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor={"address"}>Bạn sống ở đâu?:</FieldLabel>
            <Input
              id={"address"}
              type={"text"}
              required
              {...register("address")}
            />
            {errors.address && (
              <span className={"text-xs text-red-500"}>
                {errors.address.message}
              </span>
            )}
          </Field>
        </FieldGroup>
        <BioUserGroup
          bio={bio}
          setBio={(action) =>
            setBioOverride(typeof action === "function" ? action(bio) : action)
          }
        />
        <div
          className={
            "flex flex-row justify-center items-center lg:justify-start gap-5"
          }
        >
          <Button
            type={"button"}
            variant={"outline"}
            className={"hover:cursor-pointer"}
            onClick={() => reset()}
          >
            Hủy bỏ
          </Button>
          <Button
            type={"submit"}
            variant={"default"}
            className={"hover:cursor-pointer flex flex-row gap-3"}
          >
            Cập nhật
            {isLoading ? (
              <div className={"animate-spin"}>
                <LuLoaderCircle />
              </div>
            ) : null}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default UpdateUserForm;
