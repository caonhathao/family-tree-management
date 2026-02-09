import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  Select,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ICreateFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import { FamilyMemberSchema } from "@/modules/family-member/family-member.schemas";
import { IDraftFamilyData } from "@/types/draft.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import { v4 } from "uuid";

const NewFamilyMemberForm = ({
  className,
  openState,
  setOpenState,
  setDraft,
}: {
  className?: string;
  openState: boolean;
  setOpenState: Dispatch<SetStateAction<boolean>>;
  setDraft: Dispatch<SetStateAction<IDraftFamilyData>>;
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ICreateFamilyMemberDto>({
    resolver: zodResolver(FamilyMemberSchema),
    defaultValues: {
      localId: "",
      fullName: "",
      gender: "",
      dateOfBirth: "",
      dateOfDeath: "",
      isAlive: false,
      biography: "",
      generation: 1,
    },
  });

  const isAlive = watch("isAlive");

  const onSubmit = (
    values: ICreateFamilyMemberDto,
    e?: React.BaseSyntheticEvent,
  ) => {
    e?.preventDefault();
    values.localId = v4();

    setDraft((prev: IDraftFamilyData) => ({
      ...prev,
      member: [...prev.member, values],
    }));
    Toaster({
      title: "Thành công",
      description: "Tạo thành viên thành công",
      type: "success",
    });
    setOpenState(false);
    reset();
  };
  return (
    <div className={`absolute z-10 ${className}`}>
      <Dialog open={openState} onOpenChange={setOpenState}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Thêm thành viên mới</DialogTitle>
              <DialogDescription>
                Điền thông tin thành viên vào biểu mẫu dưới đây.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <span className="text-xs text-red-500">
                    {errors.fullName.message}
                  </span>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label htmlFor="gender">Giới tính</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="hover:cursor-pointer">
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem
                              value="MALE"
                              className="hover:cursor-pointer"
                            >
                              Nam
                            </SelectItem>
                            <SelectItem
                              value="FEMALE"
                              className="hover:cursor-pointer"
                            >
                              Nữ
                            </SelectItem>
                            <SelectItem
                              value="OTHER"
                              className="hover:cursor-pointer"
                            >
                              Khác
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <span className="text-xs text-red-500">
                      {errors.gender.message}
                    </span>
                  )}
                </Field>
                <Field>
                  <Label htmlFor="generation">Thế hệ</Label>
                  <Input
                    id="generation"
                    type="number"
                    min={1}
                    {...register("generation", { valueAsNumber: true })}
                  />
                  {errors.generation && (
                    <span className="text-xs text-red-500">
                      {errors.generation.message}
                    </span>
                  )}
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                  />
                  {errors.dateOfBirth && (
                    <span className="text-xs text-red-500">
                      {errors.dateOfBirth.message}
                    </span>
                  )}
                </Field>
                <Field>
                  <Label htmlFor="dateOfDeath">Ngày mất</Label>
                  <Input
                    id="dateOfDeath"
                    type="date"
                    disabled={isAlive}
                    {...register("dateOfDeath")}
                  />
                  {errors.dateOfDeath && (
                    <span className="text-xs text-red-500">
                      {errors.dateOfDeath.message}
                    </span>
                  )}
                </Field>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="isAlive"
                  className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                  {...register("isAlive")}
                />
                <Label htmlFor="isAlive" className="font-normal cursor-pointer">
                  Thành viên này còn sống
                </Label>
              </div>
              <Field>
                <Label htmlFor="biography">Tiểu sử</Label>
                <Textarea
                  id="biography"
                  placeholder="Nhập tiểu sử..."
                  className="resize-none"
                  {...register("biography")}
                />
                {errors.biography && (
                  <span className="text-xs text-red-500">
                    {errors.biography.message}
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
                className={
                  "w-fit flex justify-center items-center gap-2 hover:cursor-pointer"
                }
              >
                Tạo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default NewFamilyMemberForm;
