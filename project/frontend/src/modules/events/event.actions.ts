"use server";

import { apiClient } from "@/lib/api/api-client.lib";
import { apiRequest } from "@/lib/api/http.client";
import { ResponseFactory } from "@/lib/res/response.factory";
import {
  IQueryEventsDto,
  IResponseEventDto,
  IResponseEventInstanceDto,
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
