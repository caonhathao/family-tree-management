import { handleError } from "@/lib/utils.lib";
import { IRelationshipDto } from "./relationship.dto";
import { RelationshipService } from "./relationship.service";
import { ResponseDataBase } from "@/types/base.types";
import { revalidatePath } from "next/cache";

export async function UpdateRelationshipAction(
  relationshipId: string,
  data: IRelationshipDto,
) {
  let isSuccess = false;
  try {
    const res: ResponseDataBase<IRelationshipDto> =
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
    const res: ResponseDataBase<IRelationshipDto> =
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
