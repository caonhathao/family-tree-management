"use client";
import { LoaderModule } from "@/components/shared/loader-module";
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
import { saveFamilyDraft } from "@/store/familyThunk";
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
import { LuLayoutPanelTop, LuGripVertical } from "react-icons/lu";
import { MdOutlineCancel, MdOutlineGrid4X4 } from "react-icons/md";
import { RiDragMoveFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";

interface IPanelEditorProps {
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

  const handleSaveFamilyDraft = async () => {
    startTransition(() => {
      dispatch(saveFamilyDraft(groupId));
    });
  };
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

        <DropdownMenuContent className={"w-56"} align={"start"} side={"right"}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className={"hover:cursor-pointer"}
              onClick={() => setOpenFamilyMemberForm(true)}
            >
              <FaPlus />
              Thêm thành viên
            </DropdownMenuItem>
            <DropdownMenuItem
              className={"hover:cursor-pointer"}
              onClick={() => setOpenRelationshipForm(true)}
            >
              <IoLink />
              Thêm quan hệ
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Hiển thị</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onLayout}
              className={"hover:cursor-pointer"}
            >
              <FaSort />
              Sắp xếp sơ đồ
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={setShowGrid}
              className={"hover:cursor-pointer"}
            >
              <MdOutlineGrid4X4 />
              Lưới
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={nodesDraggable}
              onCheckedChange={setNodesDraggable}
            >
              <RiDragMoveFill />
              Cho phép kéo thả
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem className={"hover:cursor-pointer"}>
              <BiDetail />
              Chi tiết
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem
              className={"hover:cursor-pointer"}
              onClick={() => setOpenFamilyForm(true)}
            >
              <IoCreateOutline />
              Tạo sơ đồ
            </DropdownMenuItem>
            <DropdownMenuItem
              className={"hover:cursor-pointer"}
              disabled={!isDirty}
              onClick={() => handleSaveFamilyDraft()}
            >
              {isPending ? (
                <LoaderModule className={"w-1 h-1"} />
              ) : (
                <FaRegSave />
              )}
              Lưu
            </DropdownMenuItem>
            <DropdownMenuItem className={"hover:cursor-pointer"}>
              <MdOutlineCancel />
              Hủy
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};
