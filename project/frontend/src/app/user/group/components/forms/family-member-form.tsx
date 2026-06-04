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
import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import { FamilyMemberSchema } from "@/modules/family-member/family-member.schemas";
import { AppDispatch, RootState } from "@/store";
import { setDraft } from "@/store/family/familySlice";

import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { v4 } from "uuid";

const NewFamilyMemberForm = ({
  currentData,
  openState,

  setCurrentData,
  setOpenState,
}: {
  currentData?: IFamilyMemberDto | null;
  openState: boolean;

  setOpenState: Dispatch<SetStateAction<boolean>>;
  setCurrentData: Dispatch<SetStateAction<IFamilyMemberDto | null>>;
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<IFamilyMemberDto>({
    resolver: zodResolver(FamilyMemberSchema),
    defaultValues: currentData || {
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

  // eslint-disable-next-line react-hooks/incompatible-library
  const isAlive = watch("isAlive");
  const { draft } = useSelector((state: RootState) => state.family);
  // console.log(draft);
  const dispatch = useDispatch<AppDispatch>();
  const onSubmit = (values: IFamilyMemberDto, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    if (draft.family.localId.length === 0) {
      Toaster({
        title: "Hành động thất bại",
        description: "Sơ đồ chưa được tạo.",
        type: "warning",
      });
      return;
    }

    const isUpdate = !!currentData;
    const memberId = isUpdate && currentData ? currentData.localId : v4();
    let position = { x: 0, y: 0 };
    if (!isUpdate && draft.members.length > 0) {
      const lastMember = draft.members[draft.members.length - 1];
      position = {
        x: (lastMember.positionX ?? 0) + 200, // Đặt sang phải một chút
        y: lastMember.positionY ?? 0,
      };
    }

    const finalValues = {
      ...values,
      localId: v4(),
      positionX: position.x,
      positionY: position.y,
    };

    const updatedMembers = isUpdate
      ? draft.members.map((m) =>
          m.localId === memberId ? { ...m, ...finalValues } : m,
        )
      : [...draft.members, finalValues];

    const updatedDraft = {
      ...draft,
      members: updatedMembers,
    };

    dispatch(setDraft(updatedDraft));
    Toaster({
      title: "Hành động thành công",
      description: isUpdate
        ? "Cập nhật thành viên thành công."
        : "Tạo thành viên thành công.",
      type: "success",
    });
    setCurrentData(null);
    setOpenState(false);
    reset();
  };

  const deleteMemberFromDraft = (memberId: string) => {
    const updatedMembers = draft.members.filter((m) => m.localId !== memberId);
    const updatedRelationships = draft.relationships.filter(
      (rel) => rel.fromMemberId !== memberId && rel.toMemberId !== memberId,
    );

    const updateDraft = {
      ...draft,
      members: updatedMembers,
      relationships: updatedRelationships,
    };
    dispatch(setDraft(updateDraft));
    Toaster({
      title: "Đã xóa",
      description: "Thành viên và các quan hệ liên quan đã được gỡ bỏ.",
      type: "info",
    });
    setOpenState(false);
    setCurrentData(null);
    reset();
  };
  return (
    <div className={`absolute z-10 `}>
      <Dialog open={openState} onOpenChange={setOpenState}>
        <DialogContent className={"sm:max-w-sm"}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Tạo/Cập nhật thành viên mới</DialogTitle>
              <DialogDescription>
                Điền thông tin thành viên vào biểu mẫu dưới đây.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor={"fullName"}>Họ và tên</Label>
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
              <div className={"grid grid-cols-2 gap-4"}>
                <Field>
                  <Label htmlFor={"gender"}>Giới tính</Label>
                  <Controller
                    name={"gender"}
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className={"hover:cursor-pointer"}>
                          <SelectValue placeholder={"Chọn"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem
                              value={"MALE"}
                              className={"hover:cursor-pointer"}
                            >
                              Nam
                            </SelectItem>
                            <SelectItem
                              value={"FEMALE"}
                              className={"hover:cursor-pointer"}
                            >
                              Nữ
                            </SelectItem>
                            <SelectItem
                              value={"OTHER"}
                              className={"hover:cursor-pointer"}
                            >
                              Khác
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <span className={"text-xs text-red-500"}>
                      {errors.gender.message}
                    </span>
                  )}
                </Field>
                <Field>
                  <Label htmlFor={"generation"}>Thế hệ</Label>
                  <Input
                    id={"generation"}
                    type={"number"}
                    min={1}
                    {...register("generation", { valueAsNumber: true })}
                  />
                  {errors.generation && (
                    <span className={"text-xs text-red-500"}>
                      {errors.generation.message}
                    </span>
                  )}
                </Field>
              </div>
              <div className={"grid grid-cols-2 gap-4"}>
                <Field>
                  <Label htmlFor={"dateOfBirth"}>Ngày sinh</Label>
                  <Input
                    id={"dateOfBirth"}
                    type={"date"}
                    {...register("dateOfBirth")}
                  />
                  {errors.dateOfBirth && (
                    <span className={"text-xs text-red-500"}>
                      {errors.dateOfBirth.message}
                    </span>
                  )}
                </Field>
                <Field>
                  <Label htmlFor={"dateOfDeath"}>Ngày mất</Label>
                  <Input
                    id={"dateOfDeath"}
                    type={"date"}
                    disabled={isAlive}
                    {...register("dateOfDeath")}
                  />
                  {errors.dateOfDeath && (
                    <span className={"text-xs text-red-500"}>
                      {errors.dateOfDeath.message}
                    </span>
                  )}
                </Field>
              </div>
              <div className={"flex items-center space-x-2 py-2"}>
                <input
                  type={"checkbox"}
                  id={"isAlive"}
                  className={
                    "h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                  }
                  {...register("isAlive")}
                />
                <Label
                  htmlFor={"isAlive"}
                  className={"font-normal cursor-pointer"}
                >
                  Thành viên này còn sống
                </Label>
              </div>
              <Field>
                <Label htmlFor={"biography"}>Tiểu sử</Label>
                <Textarea
                  id={"biography"}
                  placeholder={"Nhập tiểu sử..."}
                  className={"resize-none"}
                  {...register("biography")}
                />
                {errors.biography && (
                  <span className={"text-xs text-red-500"}>
                    {errors.biography.message}
                  </span>
                )}
              </Field>
            </FieldGroup>
            <DialogFooter className={"pt-2"}>
              <DialogClose asChild>
                <Button variant={"outline"} className={"hover:cursor-pointer"}>
                  Hủy
                </Button>
              </DialogClose>
              <Button
                type={"button"}
                variant={"destructive"}
                disabled={currentData === null}
                className={"hover:cursor-pointer"}
                onClick={() =>
                  deleteMemberFromDraft(currentData?.localId || "")
                }
              >
                Xóa
              </Button>
              <Button
                type={"submit"}
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
