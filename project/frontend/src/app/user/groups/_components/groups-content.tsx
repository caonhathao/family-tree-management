import { IResponseGroupFamiliesDto } from "@/modules/group-family/group-family.dto";
import GroupCard from "./group-card";

const GroupsContent = ({ groups }: { groups: IResponseGroupFamiliesDto[] }) => {
  if (groups.length === 0) {
    return (
      <div
        className={
          "w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground"
        }
      >
        <p className={"text-sm sm:text-base"}>Bạn chưa tham gia nhóm nào.</p>
      </div>
    );
  }

  return (
    <div className={"w-full h-full flex flex-col items-center gap-5 py-5"}>
      <div className={"w-full flex justify-center px-4"}>
        <h2 className={"text-lg font-bold sm:text-xl"}>Danh sách nhóm</h2>
      </div>
      <div
        className={
          "grid w-full max-w-6xl grid-cols-2 place-content-start gap-4 px-4 pb-6 md:grid-cols-3 lg:grid-cols-4"
        }
      >
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
};

export default GroupsContent;
