import { apiClient } from "@/lib/api/api-path.lib";
import { CreateRegisterDto, LoginBaseDto } from "./auth.dto";

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
};
