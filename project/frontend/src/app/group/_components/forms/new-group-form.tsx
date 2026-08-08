"use client";
import { LoaderModule } from "@/components/shared/loader-module";
import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGroupFamilyAction } from "@/modules/group-family/group-family.actions";
import { ICreateGroupFamilyDto } from "@/modules/group-family/group-family.dto";
import { ISuccessResponse } from "@/types/base.types";
import { CreateGroupFamilySchema } from "@/modules/group-family/group-family.client-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { ApiResponse } from "@/types/api.types";

const NewGroupForm = ({ className }: { className?: string }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ICreateGroupFamilyDto>({
    resolver: zodResolver(CreateGroupFamilySchema),
    defaultValues: {
      name: "",
      description: "",
      role: undefined,
    },
  });

  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState<boolean>(false);

  const onSubmit = (
    values: ICreateGroupFamilyDto,
    e?: React.BaseSyntheticEvent,
  ) => {
    e?.preventDefault();

    startTransition(async () => {
      const result: ISuccessResponse | ApiResponse<never, unknown> | undefined =
        await createGroupFamilyAction(values);
      // console.log(result);

      if (result && "errors" in result) {
        Toaster({
          title: "Khởi tạo thất bại",
          description: result.message,
          type: "error",
        });
      }
      setOpen(false); // Đóng dialog
      Toaster({
        title: "Thành công",
        description: "Tạo nhóm thành công",
        type: "success",
      });
    });
  };

  useEffect(() => {
    reset();
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={"w-full flex justify-center items-center"}>
          <Button
            variant={"default"}
            className={`hover:cursor-pointer w-fit ${className} text-sm sm:text-base lg:text-base p-5 rounded-md border border-primary/30 shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.98]`}
          >
            Tạo nhóm
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className={"w-full lg:w-lg"}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className={"text-lg sm:text-xl lg:text-2xl"}>
              Tạo nhóm mới
            </DialogTitle>
            <DialogDescription className={"text-sm sm:text-base lg:text-lg"}>
              Điền thông tin nhóm vào biểu mẫu dưới đây.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field className={""}>
              <Label
                htmlFor={"name-1"}
                className={"text-sm sm:text-base lg:text-base"}
              >
                Tên nhóm
              </Label>
              <Input
                id={"name-1"}
                type={"text"}
                required
                {...register("name")}
                className={""}
              />
              {errors.name && (
                <span className={"text-xs text-red-500"}>
                  {errors.name.message}
                </span>
              )}
            </Field>
            <Field>
              <Label
                htmlFor={"username-1"}
                className={"text-sm sm:text-base lg:text-base"}
              >
                Mô tả
              </Label>
              <Input
                id={"username-1"}
                type={"text"}
                required
                {...register("description")}
              />
              {errors.description && (
                <span className={"text-xs text-red-500"}>
                  {errors.description.message}
                </span>
              )}
            </Field>
            <Field>
              <Label
                htmlFor={"username-1"}
                className={"text-sm sm:text-base lg:text-base"}
              >
                Vai trò của bạn
              </Label>
              <Controller
                name={"role"}
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger
                      className={
                        "w-45 text-sm hover:cursor-pointer sm:text-base"
                      }
                    >
                      <SelectValue placeholder={"Vai trò"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          value={"OWNER"}
                          className={
                            "hover:cursor-pointer text-sm sm:text-base"
                          }
                        >
                          Chủ gia đình
                        </SelectItem>
                        <SelectItem
                          value={"EDITOR"}
                          className={
                            "hover:cursor-pointer text-sm sm:text-base"
                          }
                        >
                          Người chỉnh sửa
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <span className={"text-xs text-red-500"}>
                  {errors.role.message}
                </span>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter className={"pt-2"}>
            <DialogClose asChild>
              <Button
                variant={"outline"}
                className={
                  "hover:cursor-pointer text-sm hover:shadow-sm active:scale-[0.98] sm:text-base"
                }
              >
                Hủy
              </Button>
            </DialogClose>
            <Button
              type={"submit"}
              disabled={isPending}
              className={`w-fit flex justify-center items-center gap-2 border border-primary/20 hover:shadow-md active:scale-[0.98] text-sm sm:text-base ${!isPending ? "hover:cursor-pointer" : "hover:cursor-not-allowed"}`}
            >
              {isPending ? (
                <>
                  <LoaderModule scale={0.6} className={"w-1 h-1"} />
                  Đang tạo...
                </>
              ) : (
                "Tạo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default NewGroupForm;
