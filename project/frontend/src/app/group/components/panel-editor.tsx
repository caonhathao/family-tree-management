"use client";
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
import { IDraftFamilyData } from "@/types/draft.types";
import { motion, useDragControls } from "framer-motion";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { BiDetail } from "react-icons/bi";
import { FaPlus, FaRegSave, FaSort } from "react-icons/fa";
import { IoCreateOutline } from "react-icons/io5";
import { LuLayoutPanelTop, LuGripVertical } from "react-icons/lu";
import { MdOutlineCancel, MdOutlineGrid4X4 } from "react-icons/md";

interface IPanelEditorProps {
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  setOpenFamilyMemberForm: Dispatch<SetStateAction<boolean>>;
  setOpenFamilyForm: Dispatch<SetStateAction<boolean>>;
}

export const PanelEditor = ({
  constraintsRef,
  setOpenFamilyMemberForm,
  setOpenFamilyForm,
}: IPanelEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const controls = useDragControls();
  const isDragging = useRef(false);

  const startDrag = (e: React.PointerEvent) => {
    controls.start(e);
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
      className="absolute z-50 flex items-center bg-background border rounded-lg shadow-lg overflow-hidden touch-none"
      initial={{ x: 20, y: 20 }}
    >
      <div
        onPointerDown={startDrag}
        className="px-1 py-2 cursor-grab active:cursor-grabbing hover:bg-accent flex items-center justify-center border-r"
      >
        <LuGripVertical className="text-muted-foreground h-4 w-4" />
      </div>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none h-10 w-10 hover:bg-accent hover:cursor-pointer"
          >
            <LuLayoutPanelTop className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="start" side="right">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="hover:cursor-pointer"
              onClick={() => setOpenFamilyMemberForm(true)}
            >
              <FaPlus />
              Thêm thành viên
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:cursor-pointer">
              <FaSort />
              Sắp xếp sơ đồ
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Hiển thị</DropdownMenuLabel>
            <DropdownMenuCheckboxItem className="hover:cursor-pointer">
              <MdOutlineGrid4X4 />
              Lưới
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem className="hover:cursor-pointer">
              <BiDetail />
              Chi tiết
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              className="hover:cursor-pointer"
              onClick={() => setOpenFamilyForm(true)}
            >
              <IoCreateOutline />
              Tạo sơ đồ
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem className="hover:cursor-pointer">
              <FaRegSave />
              Lưu
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem className="hover:cursor-pointer">
              <MdOutlineCancel />
              Hủy
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};
