import { handleError } from "@/lib/utils.lib";
import { RelationshipDto } from "./relationship.dto";
import { RelationshipService } from "./relationship.service";
import { ResponseDataBase } from "@/types/base.types";
import { revalidatePath } from "next/cache";

export async function CreateRelationshipAction(data: RelationshipDto[]) {
  let isSuccess = false;
  try {
    const res: ResponseDataBase<RelationshipDto> =
      await RelationshipService.createRelationship(data);
    if (res.success) {
      isSuccess = true;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath("/family");
  }
}

export async function UpdateRelationshipAction(
  relationshipId: string,
  data: RelationshipDto,
) {
  let isSuccess = false;
  try {
    const res: ResponseDataBase<RelationshipDto> =
      await RelationshipService.updateRelationship(relationshipId, data);
    if (res.success) {
      isSuccess = true;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath("/family");
  }
}

export async function DeleteRelationshipAction(
  relationshipId: string,
  familyId: string,
) {
  let isSuccess = false;
  try {
    const res: ResponseDataBase<RelationshipDto> =
      await RelationshipService.deleteRelationship(relationshipId, familyId);
    if (res.success) {
      isSuccess = true;
    } else return { err: res.message || "error" };
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    revalidatePath("/family");
  }
}
