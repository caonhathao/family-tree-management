import { apiClient } from "@/lib/api/api-path.lib";
import { cookies } from "next/headers";
import {
  CreateFamilyMemberDto,
  updateFamilyMemberDto,
} from "./family-member.dto";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";

export const FamilyMemberService = {
  createMember: async (groupId: string, data: CreateFamilyMemberDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const formData = new FormData();

    // Duyệt qua các key của DTO để append vào FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Nếu là File (ảnh), append trực tiếp
        // Nếu là dữ liệu khác, FormData sẽ tự chuyển về string
        formData.append(key, value instanceof Blob ? value : String(value));
      }
    });

    const result = await fetchWithAuth(
      apiClient.familyMember.createMember(groupId),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );
    return result.json();
  },
  updateMember: async (groupId: string, data: updateFamilyMemberDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const formData = new FormData();

    // Duyệt qua các key của DTO để append vào FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Nếu là File (ảnh), append trực tiếp
        // Nếu là dữ liệu khác, FormData sẽ tự chuyển về string
        formData.append(key, value instanceof Blob ? value : String(value));
      }
    });

    const result = await fetchWithAuth(
      apiClient.familyMember.updateMember(groupId),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );
    return result.json();
  },
  getOneMember: async (memberId: string, familyId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const result = await fetchWithAuth(
      apiClient.familyMember.getOneMember(memberId, familyId),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return result.json();
  },

  getAllMember: async (familyId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const result = await fetchWithAuth(
      apiClient.familyMember.getAllMembers(familyId),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return result.json();
  },
  delete: async (memberId: string, familyId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const result = await fetchWithAuth(
      apiClient.familyMember.deleteMember(memberId, familyId),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return result.json();
  },
};
