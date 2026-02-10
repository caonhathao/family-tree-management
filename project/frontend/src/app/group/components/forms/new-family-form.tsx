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
import { Textarea } from "@/components/ui/textarea";
import { IFamilyDto } from "@/modules/family/family.dto";
import { FamilySchema } from "@/modules/family/family.schemas";
import { IDraftFamilyData } from "@/types/draft.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";

const NewFamilyForm = ({
  className,
  openState,
  setOpenState,
  draft,
  setDraft,
}: {
  className?: string;
  openState: boolean;
  setOpenState: Dispatch<SetStateAction<boolean>>;
  draft: IDraftFamilyData;
  setDraft: Dispatch<SetStateAction<IDraftFamilyData>>;
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IFamilyDto>({
    resolver: zodResolver(FamilySchema),
    defaultValues: {
      localId: "",
      name: "",
      description: "",
    },
  });

  const onSubmit = (values: IFamilyDto, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    if (draft.family.localId.length !== 0) {
      Toaster({
        title: "Tạo sơ đồ thất bại",
        description: "Sơ đồ đã được tạo rồi",
        type: "warning",
      });
      return;
    }
    values.localId = v4();

    setDraft((prev: IDraftFamilyData) => ({
      ...prev,
      family: values,
    }));
    Toaster({
      title: "Tạo sơ đồ thành công",
      description: "Hãy tạo thêm thành viên trong sơ đồ",
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
              <DialogTitle>Tạo sơ đồ mới</DialogTitle>
              <DialogDescription>
                {draft.family.localId.length !== 0 ? (
                  <p className="text-red-500">Sơ đồ đã được tạo rồi</p>
                ) : (
                  "Điền thông tin sơ đồ vào biểu mẫu dưới đây."
                )}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="fullName">Tên sơ đồ</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  {...register("name")}
                />
                {errors.name && (
                  <span className="text-xs text-red-500">
                    {errors.name.message}
                  </span>
                )}
              </Field>

              <Field>
                <Label htmlFor="biography">Mô tả chung</Label>
                <Textarea
                  id="biography"
                  className="resize-none"
                  {...register("description")}
                />
                {errors.description && (
                  <span className="text-xs text-red-500">
                    {errors.description.message}
                  </span>
                )}
              </Field>
            </FieldGroup>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="hover:cursor-pointer"
                >
                  Hủy
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={draft.family.localId.length !== 0}
                className={`w-fit flex justify-center items-center gap-2 ${draft.family.localId.length === 0 ? "hover:cursor-pointer" : "hover:cursor-not-allowed"}`}
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
export default NewFamilyForm;
