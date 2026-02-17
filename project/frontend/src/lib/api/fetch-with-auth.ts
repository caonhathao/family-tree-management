"use server";
import { cookies } from "next/headers";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();

  const token = cookieStore.get("access_token")?.value;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    console.log("Unauthorized: Both access and refresh tokens are invalid");
    return {
      success: false,
      message: "Unauthorized: Please login again",
      code: 401,
    };
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Lỗi kết nối Server");
  }

  return data;
}
