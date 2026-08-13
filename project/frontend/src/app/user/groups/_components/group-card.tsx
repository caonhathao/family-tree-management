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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { quitGroupFromListAction } from "@/modules/group-family/group-family.actions";
import { IResponseGroupFamiliesDto } from "@/modules/group-family/group-family.dto";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const GroupCard = ({ group }: { group: IResponseGroupFamiliesDto }) => {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleQuitGroup = () => {
    startTransition(async () => {
      const res = await quitGroupFromListAction(group.id);

      setDialogOpen(false);
      if (res && "errors" in res) {
        Toaster({
          title: "Lỗi",
          description: res.message,
          type: "error",
        });
        return;
      }

      Toaster({
        title: "Thành công",
        description: "Bạn đã rời khỏi nhóm.",
        type: "success",
      });
      router.refresh();
    });
  };

  return (
    <Card
      className={
        "flex flex-col justify-between gap-3 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      }
    >
      <CardHeader className={"px-4"}>
        <CardTitle className={"truncate text-sm sm:text-base"}>
          {group.name}
        </CardTitle>
      </CardHeader>
      <CardContent className={"px-4"}>
        <p className={"line-clamp-2 text-xs text-muted-foreground sm:text-sm"}>
          {group.description?.trim() || "Chưa có mô tả."}
        </p>
      </CardContent>
      <CardFooter
        className={cn(
          "grid grid-cols-1",
          "w-full items-center justify-between gap-2 px-4",
        )}
      >
        <Button asChild variant={"outline"} size={"sm"}>
          <Link href={`/group?groupId=${group.id}`}>Xem nhóm</Link>
        </Button>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type={"button"}
              variant={"destructive"}
              size={"sm"}
              className={
                "hover:cursor-pointer border border-destructive/20 hover:shadow-md active:scale-[0.98]"
              }
              disabled={isPending}
            >
              Rời nhóm
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={"text-base sm:text-lg"}>
                Bạn chắc chứ?
              </AlertDialogTitle>
              <AlertDialogDescription className={"text-sm sm:text-base"}>
                Bạn sẽ rời khỏi nhóm &quot;{group.name}&quot;. Hành động này
                không thể thu hồi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Thoát</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  type={"button"}
                  variant={"destructive"}
                  className={
                    "hover:cursor-pointer border border-destructive/20 hover:shadow-md active:scale-[0.98]"
                  }
                  disabled={isPending}
                  onClick={() => handleQuitGroup()}
                >
                  Đồng ý
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default GroupCard;
