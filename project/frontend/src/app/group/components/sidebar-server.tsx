import { getAllGroupAction } from "@/modules/group-family/group-family.actions";
import { IResponseGroupFamiliesDto } from "@/modules/group-family/group-family.dto";

export async function SideBarServer({
  children,
}: {
  children: (groups: IResponseGroupFamiliesDto[]) => React.ReactNode;
}) {
  const groupList = await getAllGroupAction();
  const groups = Array.isArray(groupList) ? groupList : [];
  return <div>{children(groups)}</div>;
}
