import { apiClient } from "@/lib/api/api-path.lib";
import { CreateRegisterDto, LoginBaseDto } from "./auth.dto";
import { cookies } from "next/headers";

export const AuthService = {
  register: async (data: CreateRegisterDto) => {
    const res = await fetch(apiClient.auth.register, {
      method: "POST",
      headers: {
        "Coontent-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  loginBase: async (data: LoginBaseDto) => {
    const res = await fetch(apiClient.auth.loginBase, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  refresh: async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;
    const res = await fetch(apiClient.auth.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();

    if (res.ok && result.success) {
      // Cập nhật lại Cookies mới
      cookieStore.set("access_token", result.data.accessToken, { /* ...options... */ });
      cookieStore.set("refresh_token", result.data.refreshToken, { /* ...options... */ });
    }
    
    return result;
  },
};
