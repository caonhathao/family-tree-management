import { apiClient } from "@/lib/api/api-path.lib";
import { RegisterDto, LoginBaseDto, IAuthResponseDto } from "./auth.dto";
import { cookies } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { ResponseDataBase } from "@/types/base.types";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";

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

  refresh: async (token: string | undefined) => {
    const res = await fetch(EnvConfig.serverDomain + apiClient.auth.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result: ResponseDataBase<IAuthResponseDto> = await res.json();
    console.log("result refresh:", result);
    return result;
  },

  logout: async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await fetch(EnvConfig.serverDomain + apiClient.auth.logOut, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    //console.log("logout:", res);
    return res.json();
  },
};
