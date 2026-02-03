import { apiClient } from "@/lib/api/api-path.lib";
import { RegisterDto, LoginBaseDto } from "./auth.dto";
import { cookies } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";

export const AuthService = {
  register: async (data: RegisterDto) => {
    const res = await fetch(EnvConfig.serverDomain + apiClient.auth.register, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  loginBase: async (data: LoginBaseDto) => {
    const res = await fetch(EnvConfig.serverDomain + apiClient.auth.loginBase, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    //console.log(await res.json())
    return res.json();
  },
  loginGoogle: async (token: string) => {
    const res = await fetch(
      EnvConfig.serverDomain + apiClient.auth.loginGoogle,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
    );
    return res.json();
  },
  refresh: async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;
    const res = await fetch(EnvConfig.serverDomain + apiClient.auth.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();

    if (res.ok && result.success) {
      // Cập nhật lại Cookies mới
      cookieStore.set("access_token", result.data.accessToken, {
        /* ...options... */
      });
      cookieStore.set("refresh_token", result.data.refreshToken, {
        /* ...options... */
      });
    }

    return result;
  },
};
