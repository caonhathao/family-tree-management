import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import { Handle, Position } from "@xyflow/react";

interface FamilyMemberNodeProps {
  id: string;
  data: IFamilyMemberDto & {
    relationshipLabel?: string | null;
    isPinned?: boolean;
  };
}

export const FamilyMemberNode = ({ id, data }: FamilyMemberNodeProps) => {
  const nameParts = data.fullName.trim().split(/\s+/);
  const lastName = nameParts[nameParts.length - 1];
  const tempAvatar = lastName ? lastName[0].toUpperCase() : "?";

  return (
    <div
      className={`relative px-4 py-2 shadow-md rounded-md border-2 bg-white transition-shadow hover:shadow-lg ${data.gender === "MALE" ? "border-blue-400" : "border-pink-400"}`}
    >
      {data.isPinned && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      )}
      <div className={"flex items-center"}>
        <div
          className={
            "rounded-full w-8 h-8 flex items-center justify-center bg-gray-100 mr-2 text-xs font-bold"
          }
        >
          {tempAvatar}
        </div>
        <div className={"ml-2"}>
          <div className={"text-sm font-bold"}>{data.fullName}</div>
          {data.relationshipLabel && (
            <div className={"text-xs font-semibold text-amber-600"}>
              {data.relationshipLabel}
            </div>
          )}
          <div className={"text-gray-500 text-xs"}>{data.gender}</div>
        </div>
      </div>

      <Handle
        type={"source"}
        position={Position.Bottom}
        id={"b"}
        className={"w-5 h-5 !bg-foreground border-2 border-background"}
      />
      <Handle
        type={"source"}
        position={Position.Right}
        id={"r"}
        className={"w-5 h-5 !bg-foreground border-2 border-background"}
      />
      <Handle
        type={"target"}
        position={Position.Top}
        id={"t"}
        className={"w-5 h-5 !bg-foreground border-2 border-background"}
      />
      <Handle
        type={"target"}
        position={Position.Left}
        id={"l"}
        className={"w-5 h-5 !bg-foreground border-2 border-background"}
      />
    </div>
  );
};
