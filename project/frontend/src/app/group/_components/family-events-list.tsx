"use client";

import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { DeleteEventDialog } from "./forms/delete-event-dialog";
import { EventForm } from "./forms/event-form";
import { getEventsByGroupAction } from "@/modules/events/event.actions";
import { EventType, IResponseEventDto } from "@/modules/events/event.dto";
import { RootState } from "@/store";
import { addDays, format, isToday, startOfDay } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FaRepeat } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { ApiResponse } from "@/types/api.types";

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  DEATH_ANNIVERSARY: "Giỗ",
  BIRTHDAY: "Sinh nhật",
  WEDDING: "Kỷ niệm cưới",
  OTHER: "Khác",
};

export const FamilyEventsList = ({
  groupId,
  canManage,
}: {
  groupId: string;
  canManage: boolean;
}) => {
  const [events, setEvents] = useState<IResponseEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEventForm, setOpenEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IResponseEventDto | null>(
    null,
  );
  const [deletingEvent, setDeletingEvent] = useState<IResponseEventDto | null>(
    null,
  );
  const refreshKey = useSelector((state: RootState) => state.events.refreshKey);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const from = startOfDay(new Date());
      const to = addDays(new Date(), 30);

      const res:
        | IResponseEventDto[]
        | ApiResponse<IResponseEventDto[], unknown> =
        await getEventsByGroupAction({
          groupId,
          from: from.toISOString(),
          to: to.toISOString(),
        });

      if (cancelled) return;

      if (!Array.isArray(res)) {
        Toaster({
          title: "Lỗi",
          description:
            (res.message as string) || "Không thể tải danh sách sự kiện",
          type: "error",
        });
      } else {
        setEvents(res);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [groupId, refreshKey]);

  if (loading) {
    return (
      <p className={"w-full text-sm text-muted-foreground"}>Đang tải...</p>
    );
  }

  if (events.length === 0) {
    return (
      <p className={"w-full text-sm italic text-muted-foreground sm:text-base"}>
        Chưa có sự kiện sắp tới
      </p>
    );
  }

  return (
    <div className={"w-full flex flex-col gap-3"}>
      {events.map((event) => {
        const next = event.instances[0];
        const startDate = new Date(next?.startTime ?? event.startTime);
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
                      setOpenEventForm(true);
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
              <span>
                {isToday(startDate)
                  ? "Hôm nay"
                  : format(startDate, "dd/MM/yyyy")}
              </span>
            </div>
          </div>
        );
      })}

      <EventForm
        groupId={groupId}
        openState={openEventForm}
        setOpenState={setOpenEventForm}
        initialEvent={editingEvent}
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
    </div>
  );
};
