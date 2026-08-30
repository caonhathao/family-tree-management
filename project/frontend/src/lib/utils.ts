import { IDraftFamilyData } from "@/types/draft.types";
import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import { IRelationshipDto } from "@/modules/relationships/relationship.dto";
import { Node, Edge } from "@xyflow/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getParents(
  memberId: string,
  rels: IRelationshipDto[],
): string[] {
  const parents: string[] = [];
  for (const r of rels) {
    if (r.type === "PARENT" && r.toMemberId === memberId) {
      parents.push(r.fromMemberId);
    }
    if (r.type === "CHILD" && r.fromMemberId === memberId) {
      parents.push(r.toMemberId);
    }
  }
  return parents;
}

function getChildren(
  memberId: string,
  rels: IRelationshipDto[],
): string[] {
  const children: string[] = [];
  for (const r of rels) {
    if (r.type === "PARENT" && r.fromMemberId === memberId) {
      children.push(r.toMemberId);
    }
    if (r.type === "CHILD" && r.toMemberId === memberId) {
      children.push(r.fromMemberId);
    }
  }
  return children;
}

function getSpouse(
  memberId: string,
  rels: IRelationshipDto[],
): string | null {
  for (const r of rels) {
    if (r.type === "SPOUSE") {
      if (r.fromMemberId === memberId) return r.toMemberId;
      if (r.toMemberId === memberId) return r.fromMemberId;
    }
  }
  return null;
}

function isOlder(
  a: IFamilyMemberDto,
  b: IFamilyMemberDto,
): boolean {
  if (a.dateOfBirth && b.dateOfBirth) {
    return new Date(a.dateOfBirth) < new Date(b.dateOfBirth);
  }
  if (a.createdAt && b.createdAt) {
    return new Date(a.createdAt) < new Date(b.createdAt);
  }
  return false;
}

interface BFSState {
  node: string;
  depth: number;
  spouseEdgeCount: number;
  path: string[];
  parentSide: "paternal" | "maternal";
}

export function computeLabels(
  pinnedId: string,
  draft: IDraftFamilyData,
): Map<string, string> {
  const labels = new Map<string, string>();
  const rels = draft.relationships;
  const memberMap = new Map(draft.members.map((m) => [m.localId, m]));

  const pinnedMember = memberMap.get(pinnedId);
  if (!pinnedMember) return labels;

  const myGender = pinnedMember.gender;

  // Step 1: Trace UP to find parents and grandparents (max 2 gen)
  const parents = getParents(pinnedId, rels);
  const grandparents: { id: string; side: "paternal" | "maternal" }[] = [];

  for (const parent of parents) {
    const gp = getParents(parent, rels);
    if (gp.length > 0) {
      grandparents.push({ id: gp[0], side: grandparents.length === 0 ? "paternal" : "maternal" });
    }
  }

  // If no grandparents found, label parents directly
  if (grandparents.length === 0) {
    for (const pid of parents) {
      const p = memberMap.get(pid);
      if (!p) continue;
      const lbl = p.gender === "MALE" ? "Cha" : "Mẹ";
      labels.set(pid, lbl);
      const spouseId = getSpouse(pid, rels);
      if (spouseId && !labels.has(spouseId)) {
        labels.set(spouseId, lbl === "Cha" ? "Mẹ" : "Cha");
      }
    }
    return labels;
  }

  // Step 2: BFS downward from each grandparent
  const visited = new Set<string>();

  for (const gp of grandparents) {
    const queue: BFSState[] = [
      {
        node: gp.id,
        depth: 0,
        spouseEdgeCount: 0,
        path: [gp.id],
        parentSide: gp.side,
      },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const member = memberMap.get(current.node);
      if (!member) continue;

      // Skip if already visited with a shorter path
      if (visited.has(`${current.node}_${current.spouseEdgeCount}`)) continue;
      visited.add(`${current.node}_${current.spouseEdgeCount}`);

      // Determine label
      const label = determineLabel(current, member, pinnedId, myGender, memberMap, rels);
      if (label) {
        labels.set(current.node, label);
      }

      // Explore children (PARENT edges in reverse + CHILD edges)
      const children = getChildren(current.node, rels);
      for (const child of children) {
        if (current.path.includes(child)) continue;
        if (child === pinnedId && current.depth + 1 === 2) continue; // Self, skip

        queue.push({
          node: child,
          depth: current.depth + 1,
          spouseEdgeCount: current.spouseEdgeCount,
          path: [...current.path, child],
          parentSide: current.parentSide,
        });
      }

      // Explore spouse
      const spouse = getSpouse(current.node, rels);
      if (spouse && !current.path.includes(spouse)) {
        queue.push({
          node: spouse,
          depth: current.depth,
          spouseEdgeCount: current.spouseEdgeCount + 1,
          path: [...current.path, spouse],
          parentSide: current.parentSide,
        });
      }

      // Maternal pruning: stop at Mẹ (depth=1 from ông bà ngoại)
      if (current.parentSide === "maternal" && current.depth === 1 && current.spouseEdgeCount === 0) {
        const isMother = parents.includes(current.node);
        if (isMother) {
          labels.set(current.node, "Mẹ");
          // Don't continue BFS beyond Mẹ on maternal side
          continue;
        }
      }
    }
  }

  // Label the pinned node's parents directly if not labeled yet
  for (const pid of parents) {
    if (!labels.has(pid)) {
      const p = memberMap.get(pid);
      if (!p) continue;
      labels.set(pid, p.gender === "MALE" ? "Cha" : "Mẹ");
    }
  }

  // Label the pinned node's spouse
  const mySpouse = getSpouse(pinnedId, rels);
  if (mySpouse && !labels.has(mySpouse)) {
    const spouse = memberMap.get(mySpouse);
    if (spouse) {
      labels.set(mySpouse, myGender === "MALE" ? "Vợ" : "Chồng");
    }
  }

  // Label self's siblings
  for (const pid of parents) {
    const siblings = getChildren(pid, rels);
    for (const sib of siblings) {
      if (sib === pinnedId || labels.has(sib)) continue;
      const sibMember = memberMap.get(sib);
      if (!sibMember) continue;

      const older = isOlder(sibMember, pinnedMember);
      if (sibMember.gender === "MALE") {
        labels.set(sib, older ? "Anh trai" : "Em trai");
      } else {
        labels.set(sib, older ? "Chị gái" : "Em gái");
      }
    }
  }

  // Label children of pinned node
  const myChildren = getChildren(pinnedId, rels);
  for (const childId of myChildren) {
    if (labels.has(childId)) continue;
    const child = memberMap.get(childId);
    if (!child) continue;

    if (child.gender === "MALE") {
      labels.set(childId, "Con trai");
    } else {
      labels.set(childId, "Con gái");
    }
  }

  // Label grandchildren
  for (const childId of myChildren) {
    const grandchildren = getChildren(childId, rels);
    for (const gc of grandchildren) {
      if (labels.has(gc)) continue;
      const gcMember = memberMap.get(gc);
      if (!gcMember) continue;

      // Check if grandchild's parent (my child) has a spouse
      const childSpouse = getSpouse(childId, rels);
      if (childSpouse && gc === childSpouse) continue; // Skip spouse of child

      if (gcMember.gender === "MALE") {
        labels.set(gc, "Cháu trai");
      } else {
        labels.set(gc, "Cháu gái");
      }
    }
  }

  return labels;
}

function determineLabel(
  state: BFSState,
  member: IFamilyMemberDto,
  pinnedId: string,
  myGender: string,
  memberMap: Map<string, IFamilyMemberDto>,
  rels: IRelationshipDto[],
): string | null {
  const { depth, spouseEdgeCount, parentSide } = state;
  const gender = member.gender;

  // Grandparent (depth=0)
  if (depth === 0 && spouseEdgeCount === 0) {
    if (parentSide === "paternal") {
      return gender === "MALE" ? "Ông" : "Bà";
    } else {
      return gender === "MALE" ? "Ông Ngoại" : "Bà Ngoại";
    }
  }

  // Grandparent's spouse (depth=0, spouseEdge=1)
  if (depth === 0 && spouseEdgeCount === 1) {
    if (parentSide === "paternal") {
      return gender === "MALE" ? "Ông" : "Bà";
    } else {
      return gender === "MALE" ? "Ông Ngoại" : "Bà Ngoại";
    }
  }

  // Parent's generation (depth=1)
  if (depth === 1) {
    // Blood relative (spouseEdgeCount=0) → parent / uncle/aunt or parent's sibling
    if (spouseEdgeCount === 0) {
      const pinnedParents = getParents(pinnedId, rels);
      // If this is a real parent of the pinned user, label directly
      if (pinnedParents.includes(member.localId)) {
        return gender === "MALE" ? "Cha" : "Mẹ";
      }
      if (parentSide === "paternal") {
        // Need age comparison with parent to determine Bác vs Chú/Cô
        const pinnedParents = getParents(pinnedId, rels);
        const parentOnPaternalSide = pinnedParents.find((pid) => {
          const gpOfParent = getParents(pid, rels);
          return gpOfParent.some((g) => getChildren(g, rels).includes(pid));
        });
        const parentMember = parentOnPaternalSide ? memberMap.get(parentOnPaternalSide) : undefined;

        if (parentMember && isOlder(member, parentMember)) {
          return "Bác";
        } else {
          return gender === "MALE" ? "Chú" : "Cô";
        }
      } else {
        // Maternal side
        return gender === "MALE" ? "Cậu" : "Dì";
      }
    }

    // In-law (spouseEdgeCount=1) → parent's spouse / uncle/aunt's spouse
    if (spouseEdgeCount === 1) {
      const spouseOf = getSpouse(member.localId, rels);
      const pinnedParents = getParents(pinnedId, rels);
      // If this person is the spouse of a real parent of the pinned user, label directly
      if (spouseOf && pinnedParents.includes(spouseOf)) {
        return gender === "MALE" ? "Cha" : "Mẹ";
      }
      if (parentSide === "paternal") {
        // Find who this person is married to
        const spouseId = getSpouse(member.localId, rels);
        if (spouseId) {
          const pinnedParents = getParents(pinnedId, rels);
          const parentOnPaternalSide = pinnedParents.find((pid) => {
            const gpOfParent = getParents(pid, rels);
            return gpOfParent.some((g) => getChildren(g, rels).includes(pid));
          });
          const parentMember = parentOnPaternalSide ? memberMap.get(parentOnPaternalSide) : undefined;
          const spouseMember = memberMap.get(spouseId);

          if (parentMember && spouseMember && isOlder(spouseMember, parentMember)) {
            // Married to older sibling → Bác gái or Dượng
            return gender === "FEMALE" ? "Bác gái" : "Dượng";
          } else {
            // Married to younger sibling
            if (gender === "FEMALE") {
              return "Thím"; // Wife of Chú
            } else {
              return "Dượng"; // Husband of Cô
            }
          }
        }
        return gender === "FEMALE" ? "Bác gái" : "Dượng";
      } else {
        // Maternal side in-law
        return gender === "MALE" ? "Dượng" : "Mợ";
      }
    }
  }

  // Self's generation (depth=2)
  if (depth === 2 && spouseEdgeCount === 0) {
    return null; // Self, no label
  }

  if (depth === 2 && spouseEdgeCount === 1) {
    // Spouse of sibling
    return null; // No anh rể/chị dâu labels per plan
  }

  // Children (depth=3)
  if (depth === 3 && spouseEdgeCount === 0) {
    // Check if this is a child's spouse
    const pinnedChildren = getChildren(pinnedId, rels);
    const childSpouses = pinnedChildren.map((c) => getSpouse(c, rels)).filter(Boolean);
    if (childSpouses.includes(member.localId)) {
      // This is a child's spouse
      // Find which child they're married to
      const marriedTo = getSpouse(member.localId, rels);
      if (marriedTo) {
        const childMember = memberMap.get(marriedTo);
        if (childMember) {
          return childMember.gender === "MALE" ? "Con dâu" : "Con rể";
        }
      }
      return gender === "MALE" ? "Con rể" : "Con dâu";
    }

    // Actual child
    return null; // Already labeled in the main function
  }

  if (depth === 3 && spouseEdgeCount === 1) {
    // Child's spouse (in-law)
    const marriedTo = getSpouse(member.localId, rels);
    if (marriedTo) {
      const childMember = memberMap.get(marriedTo);
      if (childMember) {
        return childMember.gender === "MALE" ? "Con dâu" : "Con rể";
      }
    }
    return gender === "MALE" ? "Con rể" : "Con dâu";
  }

  // Grandchildren (depth=4+)
  if (depth >= 4 && spouseEdgeCount === 0) {
    if (depth === 4) {
      return gender === "MALE" ? "Cháu trai" : "Cháu gái";
    }
    if (depth === 5) {
      return gender === "MALE" ? "Chắt trai" : "Chắt gái";
    }
  }

  return null;
}

export const mapDraftToFlow = (
  draft: IDraftFamilyData,
  type: string,
  labels?: Map<string, string>,
) => {
  const members = draft.members || [];
  const relationships = draft.relationships || [];

  const nodes: Node[] = members.map((m, index) => ({
    id: m.localId,
    data: {
      fullName: m.fullName,
      gender: m.gender,
      generation: m.generation,
      relationshipLabel: labels?.get(m.localId) ?? null,
    },
    position: {
      x: m.positionX ?? index * 250,
      y: m.positionY ?? m.generation * 150,
    },
    type: type,
  }));

  const edges: Edge[] = relationships.map((r) => {
    const isSpouse = r.type === "SPOUSE";
    return {
      id: r.localId,
      source: r.fromMemberId,
      target: r.toMemberId,
      label: r.type,
      animated: true,
      type: "smoothstep",
      sourceHandle: isSpouse ? "r" : "b",
      targetHandle: isSpouse ? "l" : "t",
    };
  });

  return { nodes, edges };
};
