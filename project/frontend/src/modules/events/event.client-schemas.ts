import { z } from "zod";

const EVENT_TYPE_VALUES = [
  "DEATH_ANNIVERSARY",
  "BIRTHDAY",
  "WEDDING",
  "OTHER",
] as const;

const RECURRENCE_FREQUENCY_VALUES = ["DAILY", "WEEKLY", "MONTHLY"] as const;

export const EventClientSchema = z
  .object({
    title: z.string().min(1, { message: "Thiếu tên sự kiện" }),
    description: z.string().optional(),
    type: z.enum(EVENT_TYPE_VALUES, { message: "Thiếu loại sự kiện" }),
    startDate: z.string().min(1, { message: "Thiếu ngày bắt đầu" }),
    startTime: z.string().min(1, { message: "Thiếu giờ bắt đầu" }),
    endDate: z.string().min(1, { message: "Thiếu ngày kết thúc" }),
    endTime: z.string().min(1, { message: "Thiếu giờ kết thúc" }),
    isRecurring: z.boolean(),
    freq: z.enum(RECURRENCE_FREQUENCY_VALUES, {
      message: "Thiếu tần suất lặp",
    }),
    interval: z.string().optional(),
    endsAt: z.string().optional(),
    count: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.startDate}T${data.startTime}`);
    const end = new Date(`${data.endDate}T${data.endTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });
    }

    if (data.isRecurring) {
      if (data.endsAt && data.count) {
        ctx.addIssue({
          code: "custom",
          path: ["count"],
          message: "Chỉ chọn một trong hai: ngày kết thúc hoặc số lần lặp",
        });
      }

      if (data.interval && !/^\d+$/.test(data.interval)) {
        ctx.addIssue({
          code: "custom",
          path: ["interval"],
          message: "Số chu kỳ phải là số nguyên dương",
        });
      }

      if (data.count && !/^\d+$/.test(data.count)) {
        ctx.addIssue({
          code: "custom",
          path: ["count"],
          message: "Số lần lặp phải là số nguyên dương",
        });
      }
    }
  });
