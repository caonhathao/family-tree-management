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
import { CreateGroupFamilyDto } from "@/modules/group-family/group-family.dto";
import { CreateGroupFamilySchema } from "@/modules/group-family/group-family.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

const NewGroupForm = ({ className }: { className?: string }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFamilyDto>({
    resolver: zodResolver(CreateGroupFamilySchema),
    defaultValues: {
      name: "",
      description: "",
      role: "",
    },
  });

  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState<boolean>(false);

  const onSubmit = (
    values: CreateGroupFamilyDto,
    e?: React.BaseSyntheticEvent,
  ) => {
    e?.preventDefault();

    startTransition(async () => {
      const result = await createGroupFamilyAction(values);
      // console.log(result);

      if (result?.error) {
        Toaster({
          title: "Khởi tạo thất bại",
          description: result.error,
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
        <div className="w-full flex justify-center items-center">
          <Button
            variant="outline"
            size={"sm"}
            className={`hover:cursor-pointer w-fit ${className}`}
          >
            Tạo nhóm
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Tạo nhóm mới</DialogTitle>
            <DialogDescription>
              Điền thông tin nhóm vào biểu mẫu dưới đây.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">Tên nhóm</Label>
              <Input id="name-1" type="text" required {...register("name")} />
              {errors.name && (
                <span className="text-xs text-red-500">
                  {errors.name.message}
                </span>
              )}
            </Field>
            <Field>
              <Label htmlFor="username-1">Mô tả</Label>
              <Input
                id="username-1"
                type="text"
                required
                {...register("description")}
              />
              {errors.description && (
                <span className="text-xs text-red-500">
                  {errors.description.message}
                </span>
              )}
            </Field>
            <Field>
              <Label htmlFor="username-1">Vai trò của bạn</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-45 hover:cursor-pointer">
                      <SelectValue placeholder="Vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="OWNER" className="hover:cursor-pointer">Chủ gia đình</SelectItem>
                        <SelectItem value="EDITOR" className="hover:cursor-pointer">Người chỉnh sửa</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <span className="text-xs text-red-500">
                  {errors.role.message}
                </span>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="hover:cursor-pointer">
                Hủy
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              className={`w-fit flex justify-center items-center gap-2 ${!isPending ? "hover:cursor-pointer" : "hover:cursor-not-allowed"}`}
            >
              {isPending ? (
                <>
                  <LoaderModule scale={0.6} className="w-1 h-1" />
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
