"use client";

import { Toaster } from "@/components/shared/toast";
import { getEventsByGroupAction } from "@/modules/events/event.actions";
import { EventType, IResponseEventDto } from "@/modules/events/event.dto";
import { addDays, format, isToday, startOfDay } from "date-fns";
import { useEffect, useState } from "react";
import { FaRepeat } from "react-icons/fa6";
import { ApiResponse } from "@/types/api.types";

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  DEATH_ANNIVERSARY: "Giỗ",
  BIRTHDAY: "Sinh nhật",
  WEDDING: "Kỷ niệm cưới",
  OTHER: "Khác",
};

export const FamilyEventsList = ({ groupId }: { groupId: string }) => {
  const [events, setEvents] = useState<IResponseEventDto[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [groupId]);

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
              <p className={"text-sm font-medium sm:text-base"}>
                {event.title}
              </p>
              {event.isRecurring ? (
                <FaRepeat className={"text-muted-foreground"} />
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
    </div>
  );
};
