import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import { Handle, Position } from "@xyflow/react";

export const FamilyMemberNode = ({
  data,
}: {
  data: IFamilyMemberDto;
}) => {
  const nameParts = data.fullName.trim().split(/\s+/);
  const lastName = nameParts[nameParts.length - 1];
  const tempAvatar = lastName ? lastName[0].toUpperCase() : "?";
  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md border-2 bg-white ${data.gender === "male" ? "border-blue-400" : "border-pink-400"}`}
    >
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-gray-100 mr-2 text-xs font-bold">
          {tempAvatar}
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.fullName}</div>
          <div className="text-gray-500 text-[10px]">{data.gender}</div>
        </div>
      </div>

      {/* Các cổng kết nối (Handle) để vẽ Edges */}
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="target" position={Position.Bottom} className="w-2 h-2" />
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <Handle type="target" position={Position.Right} className="w-2 h-2" />
    </div>
  );
};
