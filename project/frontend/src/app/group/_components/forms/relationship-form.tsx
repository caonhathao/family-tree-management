"use client";
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

import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { v4 } from "uuid";
import { MemberSelect } from "../member-select";
import { setDraft } from "@/store/family/familySlice";

const getChildrenOf = (
  memberId: string,
  rels: IRelationshipDto[],
): string[] => {
  const children: string[] = [];
  for (const r of rels) {
    if (r.type === "PARENT" && r.fromMemberId === memberId) {
      children.push(r.toMemberId);
    }
    if (r.type === "CHILD" && r.toMemberId === memberId) {
      children.push(r.fromMemberId);
    }
  }
  return children;
};

const collectSubtree = (
  memberId: string,
  rels: IRelationshipDto[],
): Set<string> => {
  const visited = new Set<string>();
  const queue: string[] = [memberId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    getChildrenOf(current, rels).forEach((child) => {
      if (!visited.has(child)) {
        visited.add(child);
        queue.push(child);
      }
    });
  }
  return visited;
};

const RelationshipForm = ({
  currentData,
  openState,
  setCurrentData,
  setOpenState,
  prefillMemberIds,
  memberNameMap,
}: {
  currentData?: IRelationshipDto | null;
  openState: boolean;
  setOpenState: Dispatch<SetStateAction<boolean>>;
  setCurrentData: Dispatch<SetStateAction<IRelationshipDto | null>>;
  prefillMemberIds?: { fromMemberId: string; toMemberId: string } | null;
  memberNameMap?: Map<string, string>;
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
      fromMemberId: prefillMemberIds?.fromMemberId || "",
      toMemberId: prefillMemberIds?.toMemberId || "",
      type: "",
    },
  });

  useEffect(() => {
    if (currentData) {
      reset(currentData);
    } else {
      reset({
        localId: "",
        fromMemberId: prefillMemberIds?.fromMemberId || "",
        toMemberId: prefillMemberIds?.toMemberId || "",
        type: "",
      });
    }
  }, [currentData, reset, openState, prefillMemberIds]);

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
    // 1. Tìm thông tin cả 2 thành viên để so sánh
    const memberA = draft.members.find(
      (m) => m.localId === values.fromMemberId,
    );
    const memberB = draft.members.find((m) => m.localId === values.toMemberId);

    if (!memberA || !memberB) return;

    // 2. Xác định ai là cấp trên (Parent) — theo quy tắc A, cha luôn là node nguồn (fromMemberId)
    const parentMember = values.type === "PARENT" ? memberA : memberB;

    const lineage = draft.family.lineageType;

    // 3. Logic kiểm tra hệ tộc chuẩn hóa
    if (values.type === "PARENT" && lineage !== "OTHER") {
      // Chuẩn hóa giới tính về chữ hoa để so sánh chính xác
      const parentGender = parentMember.gender?.toUpperCase();

      const isPatrilinealError =
        lineage === "PATRIARCHAL" && parentGender !== "MALE";
      const isMatrilinealError =
        lineage === "MATRIARCHAL" && parentGender !== "FEMALE";

      if (isPatrilinealError || isMatrilinealError) {
        Toaster({
          title: "Sai hệ tộc",
          description: `Theo ${lineage === "PATRIARCHAL" ? "Phụ hệ" : "Mẫu hệ"}, người kết nối đời trên phải là ${lineage === "PATRIARCHAL" ? "Nam" : "Nữ"}. (Đang check: ${parentMember.fullName})`,
          type: "error",
        });
        return;
      }
    }

    if (!isUpdate) {
      values.localId = v4();
    }

    const membersById = new Map(
      draft.members.map((m) => [m.localId, m] as const),
    );
    const fromMember = membersById.get(values.fromMemberId);
    const toMember = membersById.get(values.toMemberId);
    const genChanges = new Map<string, number>();

    if (fromMember && toMember) {
      if (values.type === "PARENT") {
        // Đích (con) tự cập nhật gen = gen nguồn (cha) + 1
        const newTargetGen = fromMember.generation + 1;
        if (toMember.generation !== newTargetGen) {
          genChanges.set(values.toMemberId, newTargetGen);
        }
      } else if (values.type === "SPOUSE") {
        // Đích lấy gen bằng nguồn, và toàn bộ con cháu của đích tịnh tiến theo delta
        const delta = fromMember.generation - toMember.generation;
        const subtree = collectSubtree(values.toMemberId, draft.relationships);
        subtree.add(values.toMemberId);
        subtree.forEach((id) => {
          const member = membersById.get(id);
          if (!member) return;
          const newGen = member.generation + delta;
          if (member.generation !== newGen) {
            genChanges.set(id, newGen);
          }
        });
      }
    }

    const updatedMembers = draft.members.map((m) =>
      genChanges.has(m.localId)
        ? { ...m, generation: genChanges.get(m.localId)! }
        : m,
    );

    const updatedDraft = {
      ...draft,
      members: updatedMembers,
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
        <DialogContent className={"sm:max-w-sm"}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className={"text-base sm:text-lg lg:text-xl"}>
                Tạo/Cập nhật mối quan hệ
              </DialogTitle>
              <DialogDescription className={"text-sm sm:text-base"}>
                Điền thông tin mối quan hệ vào biểu mẫu dưới đây.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label
                  htmlFor={"fromMemberId"}
                  className={"text-sm sm:text-base lg:text-base"}
                >
                  Thành viên 1 (Nguồn)
                </Label>
                <Controller
                  name={"fromMemberId"}
                  control={control}
                  render={({ field }) => (
                    <MemberSelect
                      members={draft.members}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={"Chọn hoặc gõ tìm tên..."}
                      displayLabel={
                        field.value
                          ? memberNameMap?.get(field.value)
                          : undefined
                      }
                    />
                  )}
                />
                {errors.fromMemberId && (
                  <span className={"text-xs text-red-500"}>
                    {errors.fromMemberId.message}
                  </span>
                )}
              </Field>
              <Field>
                <Label
                  htmlFor={"toMemberId"}
                  className={"text-sm sm:text-base lg:text-base"}
                >
                  Thành viên 2 (Đích)
                </Label>
                <Controller
                  name={"toMemberId"}
                  control={control}
                  render={({ field }) => (
                    <MemberSelect
                      members={draft.members}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={"Chọn hoặc gõ tìm tên..."}
                      displayLabel={
                        field.value
                          ? memberNameMap?.get(field.value)
                          : undefined
                      }
                    />
                  )}
                />
                {errors.toMemberId && (
                  <span className={"text-xs text-red-500"}>
                    {errors.toMemberId.message}
                  </span>
                )}
              </Field>

              <Field>
                <Label
                  htmlFor={"type"}
                  className={"text-sm sm:text-base lg:text-base"}
                >
                  Loại quan hệ
                </Label>
                <Controller
                  name={"type"}
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        className={"hover:cursor-pointer text-sm sm:text-base"}
                      >
                        <SelectValue placeholder={"Chọn loại quan hệ"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem
                            value={"PARENT"}
                            className={
                              "hover:cursor-pointer text-sm sm:text-base"
                            }
                          >
                            Cha/Mẹ
                          </SelectItem>
                          <SelectItem
                            value={"SPOUSE"}
                            className={
                              "hover:cursor-pointer text-sm sm:text-base"
                            }
                          >
                            Vợ/Chồng
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <span className={"text-xs text-red-500"}>
                    {errors.type.message}
                  </span>
                )}
              </Field>
            </FieldGroup>
            <DialogFooter className={"pt-2"}>
              <DialogClose asChild>
                <Button
                  type={"button"}
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
                className={`w-fit flex justify-center items-center gap-2 border border-primary/20 hover:shadow-md active:scale-[0.98] text-sm hover:cursor-pointer sm:text-base`}
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
