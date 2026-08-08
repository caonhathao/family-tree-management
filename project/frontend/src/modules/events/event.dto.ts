export type EventType = "DEATH_ANNIVERSARY" | "BIRTHDAY" | "WEDDING" | "OTHER";

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export type EventInstanceStatus =
  | "SCHEDULED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "SKIPPED";

export interface IResponseEventRecurrenceDto {
  id: string;
  eventId: string;
  freq: RecurrenceFrequency;
  interval: number;
  endsAt: string | null;
  count: number | null;
}

export interface IResponseEventInstanceDto {
  id: string;
  eventId: string;
  startTime: string;
  endTime: string;
  status: EventInstanceStatus;
}

export interface IResponseEventDto {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  type: EventType;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  createBy: string;
  createdAt: string;
  updatedAt: string;
  recurrence: IResponseEventRecurrenceDto | null;
  instances: IResponseEventInstanceDto[];
  group?: { id: string; name: string };
}

export interface IQueryEventsDto {
  groupId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
