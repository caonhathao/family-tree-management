"use client";
import { LoaderModule } from "@/components/shared/loader-module";
import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppDispatch, RootState } from "@/store";
import { deleteFamily, saveFamilyDraft } from "@/store/family/familyThunk";

import { motion, useDragControls } from "framer-motion";
import isEqual from "lodash.isequal";
import {
  Dispatch,
  SetStateAction,
  useRef,
  useState,
  useTransition,
} from "react";
import { BiDetail } from "react-icons/bi";
import { FaPlus, FaRegSave, FaSort } from "react-icons/fa";
import { IoCreateOutline, IoLink } from "react-icons/io5";
import { LuLayoutPanelTop, LuGripVertical, LuEraser } from "react-icons/lu";
import { MdOutlineGrid4X4 } from "react-icons/md";
import { RiDragMoveFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { IDraftFamilyData } from "@/types/draft.types";
export interface IPanelEditorProps {
  groupId: string;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  setOpenFamilyMemberForm: Dispatch<SetStateAction<boolean>>;
  setOpenFamilyForm: Dispatch<SetStateAction<boolean>>;
  setOpenRelationshipForm: Dispatch<SetStateAction<boolean>>;
  showGrid: boolean;
  setShowGrid: Dispatch<SetStateAction<boolean>>;
  onLayout: () => void;
  nodesDraggable: boolean;
  setNodesDraggable: Dispatch<SetStateAction<boolean>>;
}

export const handleSaveFamilyDraft = async ({
  startTransition,
  dispatch,
  groupId,
}: {
  startTransition: (callback: () => void) => void;
  dispatch: AppDispatch;
  groupId: string;
}) => {
  startTransition(async () => {
    try {
      // unwrap() sẽ ném lỗi vào catch nếu Thunk bị rejected
      await dispatch(saveFamilyDraft(groupId)).unwrap();

      Toaster({
        title: "Thành công",
        description: "Bản nháp gia đình đã được lưu.",
        type: "success",
        cancel: { label: "OK", onClick: () => {} },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (
        error?.message === "Unauthorized" ||
        error?.message?.includes("401")
      ) {
        const router = useRouter();
        const callbackUrl = encodeURIComponent(window.location.href);
        router.push(`/auth?mode=login&callbackUrl=${callbackUrl}`);
        return;
      }

      Toaster({
        title: "Lỗi",
        description: error?.message || "Không thể lưu bản nháp.",
        type: "error",
        cancel: { label: "OK", onClick: () => {} },
      });
    }
  });
};

export const handleOpenFamilyMemberForm = ({
  draft,
  setOpenFamilyMemberForm,
}: {
  draft: IDraftFamilyData;
  setOpenFamilyMemberForm: Dispatch<SetStateAction<boolean>>;
}) => {
  if (draft.family.localId === "") {
    Toaster({
      title: "Lỗi",
      description: "Vui lòng tạo sơ đồ trước khi thêm thành viên.",
      type: "error",
      cancel: { label: "OK", onClick: () => {} },
    });
  } else {
    setOpenFamilyMemberForm(true);
  }
};

export const handleDeleteAll = async ({
  startTransition,
  dispatch,
  groupId,
}: {
  startTransition: (callback: () => void) => void;
  dispatch: AppDispatch;
  groupId: string;
}) => {
  startTransition(async () => {
    try {
      const result = await dispatch(deleteFamily(groupId)).unwrap();

      if ("id" in result)
        Toaster({
          title: "Thành công",
          description: "Sơ đồ gia đình đã được xóa.",
          type: "success",
          cancel: { label: "OK", onClick: () => {} },
        });
      else if ("errors" in result) {
        Toaster({
          title: "Lỗi",
          description: result.message,
          type: "success",
          cancel: { label: "OK", onClick: () => {} },
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Toaster({
        title: "Lỗi",
        description: error?.message || "Không thể xóa bản nháp.",
        type: "error",
        cancel: { label: "OK", onClick: () => {} },
      });
    }
  });
};

export const PanelEditor = ({
  groupId,
  constraintsRef,
  setOpenFamilyMemberForm,
  setOpenFamilyForm,
  setOpenRelationshipForm,
  showGrid,
  setShowGrid,
  onLayout,
  nodesDraggable,
  setNodesDraggable,
}: IPanelEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const controls = useDragControls();
  const isDragging = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const { draft, origin } = useSelector((state: RootState) => state.family);
  const isDirty = !isEqual(draft, origin);
  const startDrag = (e: React.PointerEvent) => {
    controls.start(e);
  };

  const [isPending, startTransition] = useTransition();

  return (
    <motion.div
      drag
      dragControls={controls}
      dragConstraints={constraintsRef}
      dragListener={false}
      dragMomentum={false}
      onDragStart={() => {
        isDragging.current = true;
      }}
      onDragEnd={() => {
        setTimeout(() => (isDragging.current = false), 100);
      }}
      className={
        "absolute z-50 flex items-center bg-background border rounded-lg shadow-lg overflow-hidden touch-none"
      }
      initial={{ x: 20, y: 20 }}
    >
      <div
        onPointerDown={startDrag}
        className={
          "px-1 py-2 cursor-grab active:cursor-grabbing hover:bg-accent flex items-center justify-center border-r"
        }
      >
        <LuGripVertical className={"text-muted-foreground h-4 w-4"} />
      </div>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"ghost"}
            size={"icon"}
            className={
              "rounded-none h-10 w-10 hover:bg-accent hover:cursor-pointer"
            }
          >
            <LuLayoutPanelTop className={"h-5 w-5"} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className={"w-56 lg:w-60"}
          align={"start"}
          side={"right"}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className={" lg:text-lg"}>
              Chung
            </DropdownMenuLabel>
            <DropdownMenuItem
              className={"hover:cursor-pointer lg:text-lg"}
              onClick={() =>
                handleOpenFamilyMemberForm({
                  draft: draft,
                  setOpenFamilyMemberForm: setOpenFamilyMemberForm,
                })
              }
            >
              <FaPlus />
              Thêm thành viên
            </DropdownMenuItem>
            <DropdownMenuItem
              className={"hover:cursor-pointer lg:text-lg"}
              onClick={() => setOpenRelationshipForm(true)}
            >
              <IoLink />
              Thêm quan hệ
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className={" lg:text-lg"}>
              Hiển thị
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onLayout}
              className={"hover:cursor-pointer lg:text-lg"}
            >
              <FaSort />
              Sắp xếp sơ đồ
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={setShowGrid}
              className={"hover:cursor-pointer lg:text-lg"}
            >
              <MdOutlineGrid4X4 />
              Lưới
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={nodesDraggable}
              onCheckedChange={setNodesDraggable}
              className={"hover:cursor-pointer lg:text-lg"}
            >
              <RiDragMoveFill />
              Cho phép kéo thả
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className={"hover:cursor-pointer lg:text-lg"}
            >
              <BiDetail />
              Chi tiết
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className={" lg:text-lg"}>
              Hành động
            </DropdownMenuLabel>
            <DropdownMenuItem
              className={"hover:cursor-pointer lg:text-lg"}
              disabled={draft.family.localId !== "" ? true : false}
              onClick={() => setOpenFamilyForm(true)}
            >
              <IoCreateOutline />
              Tạo sơ đồ
            </DropdownMenuItem>
            <DropdownMenuItem
              className={"hover:cursor-pointer lg:text-lg"}
              disabled={!isDirty}
              onClick={() =>
                handleSaveFamilyDraft({
                  dispatch: dispatch,
                  groupId: groupId,
                  startTransition: startTransition,
                })
              }
            >
              {isPending ? (
                <LoaderModule className={"w-1 h-1"} />
              ) : (
                <FaRegSave />
              )}
              Lưu
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={draft.family.localId === "" ? true : false}
              className={"hover:cursor-pointer lg:text-lg"}
              onClick={() =>
                handleDeleteAll({
                  dispatch: dispatch,
                  groupId: groupId,
                  startTransition: startTransition,
                })
              }
            >
              <LuEraser />
              Xóa toàn bộ
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};
