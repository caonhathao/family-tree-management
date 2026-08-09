"use client";

import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getEventsByGroupAction } from "@/modules/events/event.actions";
import { IResponseEventDto } from "@/modules/events/event.dto";
import { RootState } from "@/store";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DayButtonProps } from "react-day-picker";
import { useSelector } from "react-redux";

function EventCalendarDayButton({
  countByDay,
  className,
  day,
  modifiers,
  ...props
}: DayButtonProps & { countByDay: Map<string, number> }) {
  const count = countByDay.get(format(day.date, "yyyy-MM-dd")) ?? 0;

  return (
    <CalendarDayButton
      day={day}
      modifiers={modifiers}
      className={className}
      {...props}
    >
      <span className={"flex flex-col items-center gap-0.5"}>
        <span>{day.date.getDate()}</span>
        {count > 0 ? (
          <span className={"flex items-center gap-0.5"} aria-hidden>
            {Array.from({ length: Math.min(count, 3) }, (_, index) => (
              <span
                key={index}
                className={"size-1 rounded-full bg-destructive"}
              />
            ))}
          </span>
        ) : null}
      </span>
    </CalendarDayButton>
  );
}

export const EventCalendar = ({
  groupId,
  onSelectDay,
}: {
  groupId: string;
  onSelectDay: (date: Date) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<IResponseEventDto[]>([]);
  const refreshKey = useSelector((state: RootState) => state.events.refreshKey);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const from = startOfMonth(month);
    const to = endOfMonth(month);

    (async () => {
      const res = await getEventsByGroupAction({
        groupId,
        from: from.toISOString(),
        to: to.toISOString(),
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
    })();

    return () => {
      cancelled = true;
    };
  }, [open, month, groupId, refreshKey]);

  const countByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      const key = format(new Date(event.startTime), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const components = useMemo(
    () => ({
      DayButton: (props: DayButtonProps) => (
        <EventCalendarDayButton {...props} countByDay={countByDay} />
      ),
    }),
    [countByDay],
  );

  const handleDayClick = (date: Date) => {
    setOpen(false);
    onSelectDay(date);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          size={"icon"}
          title={"Lịch sự kiện"}
          className={"hover:cursor-pointer active:scale-[0.98]"}
        >
          <CalendarDays />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={"w-auto p-0"} align={"end"}>
        <Calendar
          components={components}
          month={month}
          onMonthChange={setMonth}
          onDayClick={handleDayClick}
        />
      </PopoverContent>
    </Popover>
  );
};
