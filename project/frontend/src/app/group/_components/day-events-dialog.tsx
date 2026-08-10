"use client";

import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteEventDialog } from "./forms/delete-event-dialog";
import { EventForm } from "./forms/event-form";
import { EVENT_TYPE_LABEL } from "./family-events-list";
import { getEventsByGroupAction } from "@/modules/events/event.actions";
import { IResponseEventDto } from "@/modules/events/event.dto";
import { RootState } from "@/store";
import { endOfDay, format, isToday, startOfDay } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FaRepeat } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { ApiResponse } from "@/types/api.types";

export const DayEventsDialog = ({
  groupId,
  canManage,
  date,
  openState,
  setOpenState,
}: {
  groupId: string;
  canManage: boolean;
  date: Date | null;
  openState: boolean;
  setOpenState: (open: boolean) => void;
}) => {
  const [events, setEvents] = useState<IResponseEventDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IResponseEventDto | null>(
    null,
  );
  const [formDate, setFormDate] = useState<Date | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<IResponseEventDto | null>(
    null,
  );
  const refreshKey = useSelector((state: RootState) => state.events.refreshKey);

  useEffect(() => {
    if (!openState || !date) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const res:
        | IResponseEventDto[]
        | ApiResponse<IResponseEventDto[], unknown> =
        await getEventsByGroupAction({
          groupId,
          from: startOfDay(date).toISOString(),
          to: endOfDay(date).toISOString(),
        });

      if (cancelled) return;

      if (Array.isArray(res)) {
        setEvents(res);
      } else {
        Toaster({
          title: "Lỗi",
          description:
            (res.message as string) || "Không thể tải danh sách sự kiện",
          type: "error",
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [openState, date, groupId, refreshKey]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingEvent(null);
      setFormDate(null);
      setDeletingEvent(null);
    }
    setOpenState(open);
  };

  const openEventForm = editingEvent !== null || formDate !== null;

  return (
    <Dialog open={openState} onOpenChange={handleOpenChange}>
      <DialogContent className={"sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle className={"text-base sm:text-lg lg:text-xl"}>
            {date
              ? isToday(date)
                ? "Hôm nay"
                : format(date, "dd/MM/yyyy")
              : ""}
          </DialogTitle>
          <DialogDescription className={"text-sm sm:text-base"}>
            Sự kiện trong ngày
          </DialogDescription>
        </DialogHeader>

        <div className={"flex w-full flex-col gap-3 py-4"}>
          {loading ? (
            <p className={"w-full text-sm text-muted-foreground"}>
              Đang tải...
            </p>
          ) : events.length === 0 ? (
            <p
              className={
                "w-full text-sm italic text-muted-foreground sm:text-base"
              }
            >
              Chưa có sự kiện trong ngày
            </p>
          ) : (
            events.map((event) => {
              const occurrence = event.instances[0];
              const start = new Date(occurrence?.startTime ?? event.startTime);
              return (
                <div
                  key={event.id}
                  className={
                    "w-full flex flex-col gap-1 rounded-lg border p-3 shadow-sm"
                  }
                >
                  <div
                    className={
                      "w-full flex flex-row justify-between items-center gap-2"
                    }
                  >
                    <div className={"flex items-center gap-2"}>
                      <p className={"text-sm font-medium sm:text-base"}>
                        {event.title}
                      </p>
                      {event.isRecurring ? (
                        <FaRepeat className={"text-muted-foreground"} />
                      ) : null}
                    </div>
                    {canManage ? (
                      <div className={"flex items-center gap-1"}>
                        <Button
                          type={"button"}
                          variant={"ghost"}
                          size={"icon-sm"}
                          title={"Chỉnh sửa"}
                          className={"hover:cursor-pointer"}
                          onClick={() => {
                            setEditingEvent(event);
                            setFormDate(null);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type={"button"}
                          variant={"ghost"}
                          size={"icon-sm"}
                          title={"Xóa"}
                          className={"text-destructive hover:cursor-pointer"}
                          onClick={() => setDeletingEvent(event)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={
                      "w-full flex flex-row justify-between items-center text-xs text-muted-foreground sm:text-sm"
                    }
                  >
                    <span>{EVENT_TYPE_LABEL[event.type]}</span>
                    <span>{format(start, "HH:mm")}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canManage ? (
          <DialogFooter className={"pt-2"}>
            <Button
              type={"button"}
              onClick={() => {
                setEditingEvent(null);
                setFormDate(date);
              }}
              className={
                "hover:cursor-pointer active:scale-[0.98] hover:shadow-md"
              }
            >
              <Plus /> Tạo sự kiện mới
            </Button>
          </DialogFooter>
        ) : null}

        <EventForm
          groupId={groupId}
          openState={openEventForm}
          setOpenState={(open) => {
            if (!open) {
              setEditingEvent(null);
              setFormDate(null);
            }
          }}
          initialEvent={editingEvent}
          initialDate={formDate}
        />

        {deletingEvent ? (
          <DeleteEventDialog
            event={deletingEvent}
            openState={true}
            setOpenState={(open) => {
              if (!open) setDeletingEvent(null);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
