import { ResponseGroupFamiliesDto } from "@/modules/group-family/group-family.dto";
import { GroupFamilyService } from "@/modules/group-family/group-family.service";

export async function SideBarServer({
  children,
}: {
  children: (groups: ResponseGroupFamiliesDto[]) => React.ReactNode;
}) {
  const groupList = await GroupFamilyService.getAll();
  console.log('group list: ',groupList);
  return <div>{children(groupList.data)}</div>;
}
