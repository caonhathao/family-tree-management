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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IRelationshipDto } from "@/modules/relationships/relationship.dto";
import { RelationshipSchema } from "@/modules/relationships/relationship.schema";
import { RootState, AppDispatch } from "@/store";
import { setDraft } from "@/store/familySlide";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { v4 } from "uuid";
import { MemberSelect } from "../member-select";

const RelationshipForm = ({
  currentData,
  openState,
  setCurrentData,
  setOpenState,
}: {
  currentData?: IRelationshipDto | null;
  openState: boolean;
  setOpenState: Dispatch<SetStateAction<boolean>>;
  setCurrentData: Dispatch<SetStateAction<IRelationshipDto | null>>;
}) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IRelationshipDto>({
    resolver: zodResolver(RelationshipSchema),
    defaultValues: currentData || {
      localId: "",
      fromMemberId: "",
      toMemberId: "",
      type: "",
    },
  });

  useEffect(() => {
    if (currentData) {
      reset(currentData);
    } else {
      reset({
        localId: "",
        fromMemberId: "",
        toMemberId: "",
        type: "",
      });
    }
  }, [currentData, reset, openState]);

  const { draft } = useSelector((state: RootState) => state.family);
  // console.log(draft);
  const dispatch = useDispatch<AppDispatch>();
  const onSubmit = (values: IRelationshipDto, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();

    if (draft.family.localId.length === 0) {
      Toaster({
        title: "Hành động thất bại",
        description: "Sơ đồ chưa được tạo.",
        type: "warning",
      });
      return;
    }

    const isUpdate = !!values.localId;

    const isExist = draft.relationships.some((rel) => {
      return (
        (rel.fromMemberId === values.fromMemberId &&
          rel.toMemberId === values.toMemberId) ||
        (rel.fromMemberId === values.toMemberId &&
          rel.toMemberId === values.fromMemberId)
      );
    });

    if (isExist && currentData === null) {
      Toaster({
        title: "Hành động thất bại",
        description: "Mối quan hệ giữa 2 thành viên này đã tồn tại.",
        type: "warning",
      });
      return;
    }

    // Check the validity of the clan for the PARENT relationship
    const sourceMember = draft.members.find(
      (m) => m.localId === values.fromMemberId,
    );
    const lineage = draft.family.lineageType;

    if (values.type === "PARENT" && lineage !== "OTHER") {
      const isPatrilinealError =
        lineage === "PATRIARCHAL" && sourceMember?.gender !== "MALE";
      const isMatrilinealError =
        lineage === "MATRIARCHAL" && sourceMember?.gender !== "FEMALE";

      if (isPatrilinealError || isMatrilinealError) {
        Toaster({
          title: "Sai hệ tộc",
          description: `Theo ${lineage === "PATRIARCHAL" ? "Phụ hệ" : "Mẫu hệ"}, người kết nối phải là ${lineage === "PATRIARCHAL" ? "Nam" : "Nữ"}.`,
          type: "error",
        });
        return;
      }
    }

    if (!isUpdate) {
      values.localId = v4();
    }

    const updatedDraft = {
      ...draft,
      relationships: isUpdate
        ? draft.relationships.map((r) =>
            r.localId === values.localId ? values : r,
          )
        : [...draft.relationships, values],
    };

    dispatch(setDraft(updatedDraft));

    Toaster({
      title: "Hành động thành công",
      description: isUpdate
        ? "Cập nhật mối quan hệ thành công."
        : "Tạo mối quan hệ thành công.",
      type: "success",
    });
    setCurrentData(null);
    setOpenState(false);
    reset();
  };
  return (
    <div className={`absolute z-10`}>
      <Dialog open={openState} onOpenChange={setOpenState}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Tạo/Cập nhật mối quan hệ</DialogTitle>
              <DialogDescription>
                Điền thông tin mối quan hệ vào biểu mẫu dưới đây.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="fromMemberId">Thành viên 1 (Nguồn)</Label>
                <Controller
                  name="fromMemberId"
                  control={control}
                  render={({ field }) => (
                    <MemberSelect
                      members={draft.members}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn hoặc gõ tìm tên..."
                    />
                  )}
                />
                {errors.fromMemberId && (
                  <span className="text-xs text-red-500">
                    {errors.fromMemberId.message}
                  </span>
                )}
              </Field>
              <Field>
                <Label htmlFor="toMemberId">Thành viên 2 (Đích)</Label>
                <Controller
                  name="toMemberId"
                  control={control}
                  render={({ field }) => (
                    <MemberSelect
                      members={draft.members}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn hoặc gõ tìm tên..."
                    />
                  )}
                />
                {errors.toMemberId && (
                  <span className="text-xs text-red-500">
                    {errors.toMemberId.message}
                  </span>
                )}
              </Field>

              <Field>
                <Label htmlFor="type">Loại quan hệ</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="hover:cursor-pointer">
                        <SelectValue placeholder="Chọn loại quan hệ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem
                            value="PARENT"
                            className="hover:cursor-pointer"
                          >
                            Cha/Mẹ
                          </SelectItem>
                          <SelectItem
                            value="SPOUSE"
                            className="hover:cursor-pointer"
                          >
                            Vợ/Chồng
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <span className="text-xs text-red-500">
                    {errors.type.message}
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
                className={`w-fit flex justify-center items-center gap-2 hover:cursor-pointer`}
              >
                {currentData ? "Cập nhật" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default RelationshipForm;
