import { getDetailGroupAction } from "@/modules/group-family/group-family.actions";
import { GroupContentPage } from "./group-content";
import { GetFamilyData } from "@/modules/family/family.actions";
import { IResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { ApiResponse } from "@/types/api.types";
import { IDraftFamilyData } from "@/types/draft.types";

export async function GroupContentWrapper({ groupId }: { groupId: string }) {
  if (!groupId)
    return (
      <div className={"w-full h-screen flex justify-center items-center"}>
        Vui lòng chọn một gia đình.
      </div>
    );

  const dataGroup:
    | IResponseGroupFamilyDetailDto
    | ApiResponse<IResponseGroupFamilyDetailDto> =
    await getDetailGroupAction(groupId);
  const familyData: IDraftFamilyData | ApiResponse<IDraftFamilyData, unknown> =
    await GetFamilyData(groupId);
  //console.log("familyData: ", familyData);

  if ("errors" in dataGroup) {
    return (
      <div className={"w-full h-screen flex justify-center items-center"}>
        Lỗi: {dataGroup.message}
      </div>
    );
  }

  if ("errors" in familyData) {
    return (
      <div className={"w-full h-screen flex justify-center items-center"}>
        Lỗi: {familyData.message}
      </div>
    );
  }

  return <GroupContentPage group={dataGroup} family={familyData} />;
}
