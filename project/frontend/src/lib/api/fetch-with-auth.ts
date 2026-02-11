import { AuthService } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  let token = cookieStore.get("access_token")?.value;

  // Lần 1: Gọi API bình thường
  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // Nếu bị 401 (Hết hạn Access Token)
  if (res.status === 401) {
    const refreshResult = await AuthService.refresh();

    if (refreshResult.success) {
      // Lấy token mới vừa được set vào cookie
      token = (await cookies()).get("access_token")?.value;

      // Lần 2: Gửi lại request ban đầu với token mới
      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } else {
      // Refresh thất bại (hết cả refresh token) -> yêu cầu login lại
      // Có thể redirect về trang login ở đây
      redirect("/login");
    }
  }

  return res.json();
}
