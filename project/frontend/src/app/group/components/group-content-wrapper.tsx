import { getDetailGroupAction } from "@/modules/group-family/group-family.actions";
import { GroupContentPage } from "./group-content";

export async function GroupContentWrapper({ groupId }: { groupId: string }) {
  if (!groupId) return <div>Vui lòng chọn một gia đình.</div>;

  const dataGroup = await getDetailGroupAction(groupId);

  if ("error" in dataGroup) {
    return <div>Lỗi: {dataGroup.error}</div>;
  }

  return <GroupContentPage data={dataGroup} />;
}
