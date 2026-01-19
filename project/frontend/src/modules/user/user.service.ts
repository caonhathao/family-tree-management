import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { UpdateUserDto } from "./user.dto";
import { apiClient } from "@/lib/api/api-path.lib";
import { cookies } from "next/headers";

export const UserServices = {
  updateUser: async (userId: string, data: UpdateUserDto, file?: File) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const formData = new FormData();
    (Object.keys(data) as Array<keyof UpdateUserDto>).forEach((key) => {
      const value = data[key]; // Bây giờ TS sẽ hiểu value là kiểu gì

      if (value !== undefined && value !== null) {
        if (key === "biography") {
          formData.append(key, JSON.stringify(value));
        } else {
          // Ép kiểu về string hoặc Blob/File để append vào FormData
          formData.append(key, String(value));
        }
      }
    });

    // Nếu có file, append vào với key là 'file' (khớp với NestJS Multer)
    if (file) {
      formData.append("file", file);
    }

    const res = await fetchWithAuth(apiClient.user.updateUser(userId), {
      method: "PATCH",
      headers: {
        Authrization: `Bearer ${token}`,
      },
      body: formData,
    });
    return res.json();
  },
  getDetail: async (userId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const res = await fetchWithAuth(apiClient.user.getDetail(userId), {
      method: "GET",
      headers: {
        Authrization: `Bearer ${token}`,
      },
    });
    return res.json();
  },
};
