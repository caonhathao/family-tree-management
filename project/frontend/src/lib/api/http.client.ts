import { cookies, headers } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { ServiceError } from "@/lib/res/service-error";
import { ApiResponse, HttpStatus, StatusCode } from "@/types/api.types";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  formData?: FormData;
  auth?: boolean;
  token?: string;
}

function isApiResponse(value: unknown): value is ApiResponse {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.success === "boolean" &&
    typeof record.code === "number" &&
    typeof record.message === "string"
  );
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    body,
    query,
    headers: extraHeaders = {},
    formData,
    auth = true,
    token,
  } = options;

  const baseUrl = EnvConfig.backendApiUrl;
  if (!baseUrl) {
    throw new ServiceError(
      "BACKEND_API_URL is not configured",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  const url = new URL(
    path.startsWith("/") ? path : `/api/${path.replace(/^\/+/, "")}`,
    baseUrl,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const requestHeaders: Record<string, string> = { ...extraHeaders };

  let bodyInit: BodyInit | undefined;
  if (formData) {
    bodyInit = formData;
  } else if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    bodyInit = JSON.stringify(body);
  }

  if (auth) {
    let bearerToken = token;
    if (!bearerToken) {
      const headerStore = await headers();
      bearerToken =
        headerStore.get("x-access-token") ||
        (await cookies()).get("access_token")?.value;
    }
    if (bearerToken) {
      requestHeaders["Authorization"] = `Bearer ${bearerToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: bodyInit,
      cache: "no-store",
    });
  } catch {
    throw new ServiceError(
      "Không thể kết nối tới server",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ServiceError(
      "Backend trả về định dạng không hợp lệ",
      (response.status as StatusCode) || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (!isApiResponse(payload)) {
    throw new ServiceError(
      "Backend trả về response không đúng chuẩn ApiResponse",
      (response.status as StatusCode) || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (!response.ok || payload.success === false) {
    throw new ServiceError(
      payload.message || "Request failed",
      payload.code ||
        (response.status as StatusCode) ||
        HttpStatus.INTERNAL_SERVER_ERROR,
      payload.errors,
    );
  }

  return payload as ApiResponse<T>;
}
