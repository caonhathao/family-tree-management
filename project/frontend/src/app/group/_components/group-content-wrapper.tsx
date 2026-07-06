import { getDetailGroupAction } from "@/modules/group-family/group-family.actions";
import { GroupContentPage } from "./group-content";
import { GetFamilyData } from "@/modules/family/family.actions";

export async function GroupContentWrapper({ groupId }: { groupId: string }) {
  if (!groupId)
    return (
      <div className={"w-full h-screen flex justify-center items-center"}>
        Vui lòng chọn một gia đình.
      </div>
    );

  const dataGroup = await getDetailGroupAction(groupId);
  const familyData = await GetFamilyData(groupId);
  //console.log("familyData: ", familyData);

  if ("error" in dataGroup) {
    return (
      <div className={"w-full h-screen flex justify-center items-center"}>
        Lỗi: {dataGroup.error}
      </div>
    );
  }

  if ("error" in familyData) {
    return (
      <div className={"w-full h-screen flex justify-center items-center"}>
        Lỗi: {familyData.error}
      </div>
    );
  }

  return <GroupContentPage group={dataGroup} family={familyData} />;
}
