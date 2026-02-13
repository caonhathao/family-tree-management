"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();

  // 1. Lấy Access Token hiện có (Nếu Middleware vừa refresh, nó đã gán vào Header/Cookie rồi)
  const token = cookieStore.get("access_token")?.value;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // 2. Gọi API
  const res = await fetch(url, { ...options, headers });

  // 3. Nếu vẫn bị 401, nghĩa là cả Refresh Token cũng đã chết hoặc có lỗi nghiêm trọng
  if (res.status === 401) {
    console.log(
      "Unauthorized và Middleware không thể cứu. Chuyển hướng login.",
    );
    // Lưu ý: redirect() ném ra một error đặc biệt, đừng bọc nó trong try-catch vô tội vạ
    redirect("/login");
  }

  // 4. Parse dữ liệu an toàn
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Lỗi kết nối Server");
  }

  return data;
}
