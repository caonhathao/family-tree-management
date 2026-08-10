"use client";

import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createEventAction,
  updateEventAction,
} from "@/modules/events/event.actions";
import { EventClientSchema } from "@/modules/events/event.client-schemas";
import {
  ICreateEventDto,
  IResponseEventDto,
  IUpdateEventDto,
} from "@/modules/events/event.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { refreshEvents } from "@/store/events/eventsSlice";
import { z } from "zod";
import { cn } from "@/lib/utils";

type EventFormValues = z.infer<typeof EventClientSchema>;

function FormDatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  disabled = false,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled) {
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type={"button"}
          variant={"outline"}
          disabled={disabled}
          className={
            "w-full justify-start gap-2 font-normal hover:cursor-pointer disabled:hover:cursor-not-allowed"
          }
        >
          <CalendarIcon className={"text-muted-foreground"} />
          {value ? (
            format(parseISO(value), "dd/MM/yyyy")
          ) : (
            <span className={"text-muted-foreground"}>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={"w-auto p-0"} align={"start"}>
        <Calendar
          onDayClick={(date) => {
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function buildDefaultValues(
  initialEvent: IResponseEventDto | null,
  initialDate: Date | null,
): EventFormValues {
  if (initialEvent) {
    const start = new Date(initialEvent.startTime);
    const end = new Date(initialEvent.endTime);
    const recurrence = initialEvent.recurrence;
    return {
      title: initialEvent.title,
      description: initialEvent.description ?? "",
      type: initialEvent.type,
      startDate: format(start, "yyyy-MM-dd"),
      startTime: format(start, "HH:mm"),
      endDate: format(end, "yyyy-MM-dd"),
      endTime: format(end, "HH:mm"),
      isRecurring: initialEvent.isRecurring,
      freq: recurrence?.freq ?? "DAILY",
      interval: recurrence ? String(recurrence.interval) : "1",
      endsAt: recurrence?.endsAt
        ? format(new Date(recurrence.endsAt), "yyyy-MM-dd")
        : "",
      count: recurrence?.count ? String(recurrence.count) : "",
    };
  }

  const base = initialDate ?? new Date();
  return {
    title: "",
    description: "",
    type: "OTHER",
    startDate: format(base, "yyyy-MM-dd"),
    startTime: "09:00",
    endDate: format(base, "yyyy-MM-dd"),
    endTime: "10:00",
    isRecurring: false,
    freq: "DAILY",
    interval: "1",
    endsAt: "",
    count: "",
  };
}

export const EventForm = ({
  groupId,
  openState,
  setOpenState,
  initialEvent = null,
  initialDate = null,
}: {
  groupId: string;
  openState: boolean;
  setOpenState: (open: boolean) => void;
  initialEvent?: IResponseEventDto | null;
  initialDate?: Date | null;
}) => {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!initialEvent;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(EventClientSchema),
    defaultValues: buildDefaultValues(initialEvent, initialDate),
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isRecurring = watch("isRecurring");
  const endsAt = watch("endsAt");
  const count = watch("count");

  const defaultValues = useMemo(
    () => buildDefaultValues(initialEvent, initialDate),
    [initialEvent, initialDate],
  );

  useEffect(() => {
    if (openState) {
      reset(defaultValues);
    }
  }, [openState, defaultValues, reset]);

  const onSubmit = async (values: EventFormValues) => {
    setSubmitting(true);

    const startTimeIso = new Date(
      `${values.startDate}T${values.startTime}`,
    ).toISOString();
    const endTimeIso = new Date(
      `${values.endDate}T${values.endTime}`,
    ).toISOString();
    const recurrence = values.isRecurring
      ? {
          freq: values.freq,
          ...(values.interval ? { interval: Number(values.interval) } : {}),
          ...(values.endsAt
            ? { endsAt: new Date(`${values.endsAt}T00:00:00`).toISOString() }
            : {}),
          ...(values.count ? { count: Number(values.count) } : {}),
        }
      : undefined;

    const res =
      isEdit && initialEvent
        ? await updateEventAction(initialEvent.id, {
            title: values.title,
            description: values.description || undefined,
            type: values.type,
            startTime: startTimeIso,
            endTime: endTimeIso,
            isRecurring: values.isRecurring,
            recurrence,
          } satisfies IUpdateEventDto)
        : await createEventAction({
            groupId,
            title: values.title,
            description: values.description || undefined,
            type: values.type,
            startTime: startTimeIso,
            endTime: endTimeIso,
            isRecurring: values.isRecurring,
            recurrence,
          } satisfies ICreateEventDto);

    if (res && "id" in res) {
      Toaster({
        title: "Thành công",
        description: isEdit ? "Đã cập nhật sự kiện" : "Đã tạo sự kiện",
        type: "success",
      });
      dispatch(refreshEvents());
      setOpenState(false);
      reset();
    } else {
      Toaster({
        title: "Lỗi",
        description: (res?.message as string) || "Không thể lưu sự kiện",
        type: "error",
      });
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogContent className={"sm:max-w-lg"}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className={"text-base sm:text-lg lg:text-xl"}>
              {isEdit ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
            </DialogTitle>
            <DialogDescription className={"text-sm sm:text-base"}>
              Điền thông tin sự kiện vào biểu mẫu dưới đây.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className={cn("py-4", "grid grid-cols-2 gap-3")}>
            <Field>
              <Label htmlFor={"event-title"} className={"text-sm sm:text-base"}>
                Tên sự kiện
              </Label>
              <Input
                id={"event-title"}
                type={"text"}
                placeholder={"VD: Giỗ tổ, Sinh nhật..."}
                {...register("title")}
              />
              {errors.title && (
                <span className={"text-xs text-red-500"}>
                  {errors.title.message}
                </span>
              )}
            </Field>

            <Field>
              <Label htmlFor={"event-type"} className={"text-sm sm:text-base"}>
                Loại sự kiện
              </Label>
              <Controller
                name={"type"}
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id={"event-type"}
                      className={
                        "w-full hover:cursor-pointer text-sm sm:text-base"
                      }
                    >
                      <SelectValue placeholder={"Chọn"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          value={"BIRTHDAY"}
                          className={
                            "hover:cursor-pointer text-sm sm:text-base"
                          }
                        >
                          Sinh nhật
                        </SelectItem>
                        <SelectItem
                          value={"DEATH_ANNIVERSARY"}
                          className={
                            "hover:cursor-pointer text-sm sm:text-base"
                          }
                        >
                          Giỗ
                        </SelectItem>
                        <SelectItem
                          value={"WEDDING"}
                          className={
                            "hover:cursor-pointer text-sm sm:text-base"
                          }
                        >
                          Kỷ niệm cưới
                        </SelectItem>
                        <SelectItem
                          value={"OTHER"}
                          className={
                            "hover:cursor-pointer text-sm sm:text-base"
                          }
                        >
                          Khác
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </FieldGroup>

          <Field className={"py-2"}>
            <Label
              htmlFor={"event-description"}
              className={"text-sm sm:text-base"}
            >
              Mô tả
            </Label>
            <Textarea
              id={"event-description"}
              className={"resize-none"}
              placeholder={"Mô tả thêm về sự kiện (không bắt buộc)"}
              {...register("description")}
            />
          </Field>

          <div
            className={"grid w-full grid-cols-[1fr_7rem] items-end gap-3  py-4"}
          >
            <div className={"flex flex-col gap-1.5"}>
              <Label className={"text-sm sm:text-base"}>Ngày bắt đầu</Label>
              <Controller
                name={"startDate"}
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.startDate && (
                <span className={"text-xs text-red-500"}>
                  {errors.startDate.message}
                </span>
              )}
            </div>
            <div className={"flex flex-col gap-1.5"}>
              <Label className={"text-sm sm:text-base"}>Giờ</Label>
              <Input type={"time"} {...register("startTime")} />
              {errors.startTime && (
                <span className={"text-xs text-red-500"}>
                  {errors.startTime.message}
                </span>
              )}
            </div>
          </div>

          <div className={"grid w-full grid-cols-[1fr_7rem] items-end gap-3"}>
            <div className={"flex flex-col gap-1.5"}>
              <Label className={"text-sm sm:text-base"}>Ngày kết thúc</Label>
              <Controller
                name={"endDate"}
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.endDate && (
                <span className={"text-xs text-red-500"}>
                  {errors.endDate.message}
                </span>
              )}
            </div>
            <div className={"flex flex-col gap-1.5"}>
              <Label className={"text-sm sm:text-base"}>Giờ</Label>
              <Input type={"time"} {...register("endTime")} />
              {errors.endTime && (
                <span className={"text-xs text-red-500"}>
                  {errors.endTime.message}
                </span>
              )}
            </div>
          </div>

          <Field className={"py-2"}>
            <div className={"flex items-center gap-2"}>
              <Controller
                name={"isRecurring"}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id={"event-recurring"}
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                )}
              />
              <Label
                htmlFor={"event-recurring"}
                className={"font-normal text-sm sm:text-base"}
              >
                Sự kiện lặp lại
              </Label>
            </div>
          </Field>

          {isRecurring && (
            <>
              <FieldGroup
                className={cn(
                  "flex flex-row justify-between gap-3 items-center",
                )}
              >
                <Field className={"py-2"}>
                  <Label
                    htmlFor={"event-freq"}
                    className={"text-sm sm:text-base"}
                  >
                    Tần suất lặp
                  </Label>
                  <Controller
                    name={"freq"}
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          id={"event-freq"}
                          className={
                            "w-full hover:cursor-pointer text-sm sm:text-base"
                          }
                        >
                          <SelectValue placeholder={"Chọn"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem
                              value={"DAILY"}
                              className={
                                "hover:cursor-pointer text-sm sm:text-base"
                              }
                            >
                              Hằng ngày
                            </SelectItem>
                            <SelectItem
                              value={"WEEKLY"}
                              className={
                                "hover:cursor-pointer text-sm sm:text-base"
                              }
                            >
                              Hằng tuần
                            </SelectItem>
                            <SelectItem
                              value={"MONTHLY"}
                              className={
                                "hover:cursor-pointer text-sm sm:text-base"
                              }
                            >
                              Hằng tháng
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field className={"py-2"}>
                  <div className={"flex items-center gap-1.5"}>
                    <Label
                      htmlFor={"event-interval"}
                      className={"text-sm sm:text-base"}
                    >
                      Mỗi (N) chu kỳ
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type={"button"}
                          variant={"ghost"}
                          size={"icon-xs"}
                          className={"hover:bg-transparent hover:cursor-help"}
                        >
                          <Info />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className={"max-w-xs text-left"}>
                        Lặp lại cách N chu kỳ một lần theo tần suất đã chọn. Ví
                        dụ: chọn &quot;Hằng tuần&quot; với N = 2 nghĩa là 2 tuần
                        1 lần.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id={"event-interval"}
                    type={"number"}
                    min={1}
                    {...register("interval")}
                  />
                  {errors.interval && (
                    <span className={"text-xs text-red-500"}>
                      {errors.interval.message}
                    </span>
                  )}
                </Field>
              </FieldGroup>

              <FieldGroup className={"grid w-full grid-cols-2 gap-4"}>
                <Field>
                  <Label className={"text-sm sm:text-base"}>
                    Kết thúc vào ngày
                  </Label>
                  <Controller
                    name={"endsAt"}
                    control={control}
                    render={({ field }) => (
                      <FormDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={"Chọn ngày kết thúc"}
                        disabled={!!count}
                      />
                    )}
                  />
                </Field>

                <Field>
                  <Label
                    htmlFor={"event-count"}
                    className={"text-sm sm:text-base"}
                  >
                    Số lần lặp
                  </Label>
                  <Input
                    id={"event-count"}
                    type={"number"}
                    min={1}
                    disabled={!!endsAt}
                    {...register("count")}
                  />
                  {errors.count && (
                    <span className={"text-xs text-red-500"}>
                      {errors.count.message}
                    </span>
                  )}
                </Field>
              </FieldGroup>

              <p className={"text-xs text-muted-foreground py-2 italic"}>
                Chỉ chọn một trong hai: ngày kết thúc hoặc số lần lặp. Nếu để
                trống cả hai, sự kiện sẽ lặp vô hạn.
              </p>
            </>
          )}
          <DialogFooter className={"pt-2"}>
            <DialogClose asChild>
              <Button
                type={"button"}
                variant={"outline"}
                disabled={submitting}
                className={
                  "hover:cursor-pointer text-sm hover:shadow-sm active:scale-[0.98] sm:text-base"
                }
              >
                Hủy
              </Button>
            </DialogClose>
            <Button
              type={"submit"}
              disabled={submitting}
              className={`w-fit flex justify-center items-center gap-2 border border-primary/20 hover:shadow-md active:scale-[0.98] text-sm sm:text-base ${submitting ? "hover:cursor-not-allowed" : "hover:cursor-pointer"}`}
            >
              {submitting
                ? "Đang lưu..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Tạo sự kiện"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
