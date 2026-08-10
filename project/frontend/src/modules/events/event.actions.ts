"use server";

import { apiClient } from "@/lib/api/api-client.lib";
import { apiRequest } from "@/lib/api/http.client";
import { ResponseFactory } from "@/lib/res/response.factory";
import {
  ICreateEventDto,
  IQueryEventsDto,
  IResponseEventDto,
  IResponseEventInstanceDto,
  IUpdateEventDto,
} from "./event.dto";

export async function getEventsByGroupAction(query: IQueryEventsDto) {
  try {
    const res = await apiRequest<IResponseEventDto[]>(
      apiClient.events.getAllEvents.url,
      {
        method: apiClient.events.getAllEvents.method,
        query: { ...query },
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return [] as IResponseEventDto[];
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function getEventInstancesAction(
  eventId: string,
  query?: Pick<IQueryEventsDto, "from" | "to">,
) {
  try {
    const res = await apiRequest<IResponseEventInstanceDto[]>(
      apiClient.events.getEventInstances.url(eventId),
      {
        method: apiClient.events.getEventInstances.method,
        query: { ...(query ?? {}) },
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return [] as IResponseEventInstanceDto[];
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function createEventAction(payload: ICreateEventDto) {
  try {
    const res = await apiRequest<IResponseEventDto>(
      apiClient.events.createEvent.url,
      {
        method: apiClient.events.createEvent.method,
        body: payload,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return ResponseFactory.error({ message: "Không có dữ liệu trả về" });
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function updateEventAction(
  eventId: string,
  payload: IUpdateEventDto,
) {
  try {
    const res = await apiRequest<IResponseEventDto>(
      apiClient.events.updateEvent.url(eventId),
      {
        method: apiClient.events.updateEvent.method,
        body: payload,
      },
    );

    if (res && "data" in res && res.data != undefined) {
      return res.data;
    }
    return ResponseFactory.error({ message: "Không có dữ liệu trả về" });
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

export async function deleteEventAction(eventId: string) {
  try {
    const res = await apiRequest<null>(
      apiClient.events.deleteEvent.url(eventId),
      {
        method: apiClient.events.deleteEvent.method,
      },
    );

    if (res && res.success) {
      return res;
    }
    return ResponseFactory.error({ message: "Không thể xóa sự kiện" });
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}
