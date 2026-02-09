import { IRelationshipDto } from "./relationship.dto";
import { cookies } from "next/headers";
import { fetchWithAuth } from "@/lib/api/fetch-with-auth";
import { apiClient } from "@/lib/api/api-path.lib";

export const RelationshipService = {
 
  updateRelationship: async (relationshipId: string, data: IRelationshipDto) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await fetchWithAuth(
      apiClient.relationship.updateRelatioship(relationshipId),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );
    return res.join();
  },
  deleteRelationship: async (relationshipId: string, familyId: string) => {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await fetchWithAuth(
      apiClient.relationship.deleteRelationship(relationshipId, familyId),
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.join();
  },
};
