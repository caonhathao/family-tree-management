"use client";

import { Toaster } from "@/components/shared/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteEventAction } from "@/modules/events/event.actions";
import { IResponseEventDto } from "@/modules/events/event.dto";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { refreshEvents } from "@/store/events/eventsSlice";

export const DeleteEventDialog = ({
  event,
  openState,
  setOpenState,
}: {
  event: IResponseEventDto;
  openState: boolean;
  setOpenState: (open: boolean) => void;
}) => {
  const dispatch = useDispatch();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteEventAction(event.id);

    if (res && res.success) {
      Toaster({
        title: "Thành công",
        description: "Đã xóa sự kiện",
        type: "success",
      });
      dispatch(refreshEvents());
      setOpenState(false);
    } else {
      Toaster({
        title: "Lỗi",
        description: (res?.message as string) || "Không thể xóa sự kiện",
        type: "error",
      });
    }

    setDeleting(false);
  };

  return (
    <AlertDialog open={openState} onOpenChange={setOpenState}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa sự kiện</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa sự kiện &ldquo;{event.title}&rdquo;? Hành
            động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant={"destructive"}
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
