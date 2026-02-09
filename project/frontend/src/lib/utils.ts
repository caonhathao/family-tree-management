import { IDraftFamilyData } from "@/types/draft.types";
import { Node, Edge } from "@xyflow/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const mapDraftToFlow = (draft: IDraftFamilyData, type: string) => {
  const nodes: Node[] = draft.member.map((m, index) => ({
    id: m.localId,
    // Truyền toàn bộ thông tin member vào data để Custom Node hiển thị
    data: { 
        fullName: m.fullName, 
        gender: m.gender,
        generation: m.generation 
    },
    // Tránh việc x=0 y=0 làm các node chồng lên nhau quá khít
    position: { x: index * 250, y: m.generation * 150 },
    type: type,
  }));

  const edges: Edge[] = draft.relationships.map((r) => ({
    id: r.localId,
    source: r.fromMemberId,
    target: r.toMemberId,
    label: r.type,
    animated: true,
    // Kiểu đường nối mượt mà cho gia phả (step hoặc smoothstep thường đẹp hơn)
    type: 'smoothstep', 
  }));

  return { nodes, edges };
};
