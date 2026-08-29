"use client";
import { IResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { FamilyInfoDrawer } from "./family-info-drawer";
import { PanelEditor } from "./menu-editor/panel-editor";
import { useEffect, useMemo, useRef, useState } from "react";
import NewFamilyMemberForm from "./forms/family-member-form";
import { IDraftFamilyData } from "@/types/draft.types";
import NewFamilyForm from "./forms/new-family-form";
import { mapDraftToFlow, computeLabels } from "@/lib/utils";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FamilyMemberNode } from "./react-flow/family-member-node";
import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import RelationshipForm from "./forms/relationship-form";
import { IRelationshipDto } from "@/modules/relationships/relationship.dto";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { setDraft, setOrigin } from "@/store/family/familySlice";
import isEqual from "lodash.isequal";
import FamilySettingDrawer from "./family-setting-drawer";
import { ApiResponse } from "@/types/api.types";
import { EventCalendar } from "./event-calendar";
import { DayEventsDialog } from "./day-events-dialog";
import { MEMBER_ROLE, GENDER } from "@/types/enums";
import { Toaster } from "@/components/shared/toast";

const nodeTypes = {
  familyNode: FamilyMemberNode,
};

const FlowFitView = ({
  layoutVersion,
  nodes,
}: {
  layoutVersion: number;
  nodes: Node[];
}) => {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (layoutVersion > 0 && nodes.length > 0) {
      fitView({ padding: 0.2, duration: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutVersion]);
  return null;
};

export const GroupContentPage = ({
  group,
  family,
}: {
  group:
    | IResponseGroupFamilyDetailDto
    | ApiResponse<IResponseGroupFamilyDetailDto>;
  family: IDraftFamilyData | ApiResponse<IDraftFamilyData, unknown>;
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const constrainRef = useRef<HTMLDivElement>(null);
  const [openFamilyForm, setOpenFamilyForm] = useState<boolean>(false);
  const [openRelationForm, setOpenRelationForm] = useState<boolean>(false);
  const [openFamilyMemberForm, setOpenFamilyMemberForm] =
    useState<boolean>(false);
  const [showGrid, setShowGrid] = useState(true);
  const [nodesDraggable, setNodesDraggable] = useState(true);
  const [editingMember, setEditingMember] = useState<IFamilyMemberDto | null>(
    null,
  );

  if (!openFamilyMemberForm && editingMember !== null) setEditingMember(null);

  const [editingRelation, setEditingRelation] =
    useState<IRelationshipDto | null>(null);

  const [prefillRelation, setPrefillRelation] = useState<{
    fromMemberId: string;
    toMemberId: string;
  } | null>(null);
  const [tempEdgeId, setTempEdgeId] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  if (!openRelationForm && editingRelation !== null) setEditingRelation(null);
  if (!openRelationForm && prefillRelation !== null) setPrefillRelation(null);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [openDayDialog, setOpenDayDialog] = useState<boolean>(false);
  const [pinnedMemberId, setPinnedMemberId] = useState<string | null>(null);

  const { draft } = useSelector((state: RootState) => state.family);
  const { profile } = useSelector((state: RootState) => state.user);

  const memberNameMap = useMemo(
    () => new Map(draft.members.map((m) => [m.localId, m.fullName])),
    [draft.members],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  if (!openRelationForm && tempEdgeId !== null) {
    setEdges((eds) => eds.filter((e) => e.id !== tempEdgeId));
    setTempEdgeId(null);
  }

  const onNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    const member = draft.members.find((m) => m.localId === node.id);
    if (member) {
      setEditingMember(member);
      setOpenFamilyMemberForm(true); // Mở form
    }
  };

  const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    // Tìm relationship trong draft dựa trên id của edge
    const relation = draft.relationships.find((r) => r.localId === edge.id);
    if (relation) {
      setEditingRelation(relation);
      setOpenRelationForm(true);
    }
  };

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    if (connection.source === connection.target) {
      Toaster({
        title: "Cảnh báo",
        description: "Không thể tự kết nối chính mình.",
        type: "warning",
      });
      return;
    }

    const isExist = draft.relationships.some(
      (r) =>
        (r.fromMemberId === connection.source &&
          r.toMemberId === connection.target) ||
        (r.fromMemberId === connection.target &&
          r.toMemberId === connection.source),
    );
    if (isExist) {
      Toaster({
        title: "Cảnh báo",
        description: "Mối quan hệ giữa 2 thành viên này đã tồn tại.",
        type: "warning",
      });
      return;
    }

    const tempId = `temp_${connection.source}_${connection.target}`;
    const tempEdge: Edge = {
      id: tempId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#eab308", strokeWidth: 2 },
      label: "TẠM",
    };

    setEdges((eds) => [...eds, tempEdge]);
    setTempEdgeId(tempId);
    setPrefillRelation({
      fromMemberId: connection.source,
      toMemberId: connection.target,
    });
    setOpenRelationForm(true);
  };

  const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 50;
    const SPOUSE_GAP = 24;
    const SIBLING_GAP = 40;
    const RANK_SEP = 160;

    const memberMap = new Map(
      draft.members.map((m) => [m.localId, m] as const),
    );

    const getSpouseOf = (id: string): string | null => {
      for (const r of draft.relationships) {
        if (r.type === "SPOUSE") {
          if (r.fromMemberId === id) return r.toMemberId;
          if (r.toMemberId === id) return r.fromMemberId;
        }
      }
      return null;
    };

    const getChildrenOf = (id: string): string[] => {
      const children: string[] = [];
      for (const r of draft.relationships) {
        if (r.type === "PARENT" && r.fromMemberId === id) {
          children.push(r.toMemberId);
        }
        if (r.type === "CHILD" && r.toMemberId === id) {
          children.push(r.fromMemberId);
        }
      }
      return children;
    };

    const isMale = (id: string): boolean =>
      memberMap.get(id)?.gender === GENDER.MALE;

    const sortChildren = (ids: string[]): string[] => {
      return [...ids].sort((a, b) => {
        const ma = memberMap.get(a);
        const mb = memberMap.get(b);
        if (ma?.dateOfBirth && mb?.dateOfBirth) {
          return (
            new Date(ma.dateOfBirth).getTime() -
            new Date(mb.dateOfBirth).getTime()
          );
        }
        const genCompare = (Number(isMale(a)) - Number(isMale(b))) * -1;
        if (genCompare !== 0) return genCompare;
        return (ma?.fullName ?? "").localeCompare(mb?.fullName ?? "");
      });
    };

    // Bề rộng ngang (px) của nhánh cây gốc tại node này (tính cả con cháu)
    const measureSubtree = (id: string, visited: Set<string>): number => {
      if (visited.has(id)) return NODE_WIDTH;
      visited.add(id);
      const spouse = getSpouseOf(id);
      const spouseExtra = spouse && !visited.has(spouse) ? NODE_WIDTH + SPOUSE_GAP : 0;

      const ownKids = getChildrenOf(id);
      if (spouse) {
        getChildrenOf(spouse).forEach((c) => {
          if (!ownKids.includes(c)) ownKids.push(c);
        });
      }
      const kids = sortChildren(
        ownKids.filter((c) => c !== spouse && !visited.has(c)),
      );

      if (kids.length === 0) {
        return NODE_WIDTH * 2 + SPOUSE_GAP + spouseExtra;
      }

      const childWidths = kids.map((c) => measureSubtree(c, visited));
      const childrenTotal =
        childWidths.reduce((a, b) => a + b, 0) +
        SIBLING_GAP * (childWidths.length - 1);
      const selfWidth = NODE_WIDTH * 2 + SPOUSE_GAP + spouseExtra;
      return Math.max(childrenTotal, selfWidth);
    };

    const positions = new Map<string, { x: number; y: number }>();

    // Xếp đệ quy một cụm (cặp vợ chồng + con cháu) với cha đặt tại trục x = cx
    const layoutSubtree = (
      id: string,
      cx: number,
      visited: Set<string>,
    ): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const member = memberMap.get(id);
      const gen = member?.generation ?? 0;
      const y = gen * RANK_SEP;

      const spouse = getSpouseOf(id);

      // 1. Đặt cặp vợ chồng (cha male = anchor, vợ kề bên)
      if (spouse && !visited.has(spouse)) {
        visited.add(spouse);
        if (isMale(id)) {
          positions.set(id, { x: cx, y });
          positions.set(spouse, { x: cx + NODE_WIDTH + SPOUSE_GAP, y });
        } else {
          positions.set(spouse, { x: cx - NODE_WIDTH - SPOUSE_GAP, y });
          positions.set(id, { x: cx, y });
        }
      } else {
        positions.set(id, { x: cx, y });
      }

      // 2. Tập hợp con của cặp
      const ownKids = getChildrenOf(id);
      if (spouse) {
        getChildrenOf(spouse).forEach((c) => {
          if (!ownKids.includes(c)) ownKids.push(c);
        });
      }
      const kids = sortChildren(
        ownKids.filter((c) => c !== id && c !== spouse && !visited.has(c)),
      );

      if (kids.length === 0) return NODE_HEIGHT;

      // 3. Đo bề rộng từng nhánh con
      const subs = kids.map((k) => {
        const w = measureSubtree(k, new Set());
        return { id: k, width: w };
      });
      const total =
        subs.reduce((a, s) => a + s.width, 0) +
        SIBLING_GAP * (subs.length - 1);

      // 4. Căn giữa hàng con theo trục cha (cx)
      let cursor = cx - total / 2;
      for (const s of subs) {
        const childCx = cursor + s.width / 2;
        layoutSubtree(s.id, childCx, visited);
        cursor += s.width + SIBLING_GAP;
      }

      return NODE_HEIGHT;
    };

    // Root = node không phải con của ai (không có PARENT tới / CHILD từ)
    const hasParent = (id: string): boolean => {
      for (const r of draft.relationships) {
        if (r.type === "PARENT" && r.toMemberId === id) return true;
        if (r.type === "CHILD" && r.fromMemberId === id) return true;
      }
      return false;
    };

    const allIds = nodes.map((n) => n.id);
    const roots = allIds.filter((id) => !hasParent(id));

    // Căn giữa toàn bộ các cụm root
    let originX = 0;
    const rootWidths = roots.map((r) => {
      const w = measureSubtree(r, new Set());
      return { id: r, width: w };
    });
    const rootsTotal =
      rootWidths.reduce((a, s) => a + s.width, 0) +
      SIBLING_GAP * Math.max(0, rootWidths.length - 1);

    let rootCursor = -rootsTotal / 2;
    const visitedGlobal = new Set<string>();
    const rootList =
      rootWidths.length > 0
        ? rootWidths
        : allIds.map((id) => ({ id, width: NODE_WIDTH * 2 }));

    for (const r of rootList) {
      const cx = rootCursor + r.width / 2;
      rootCursor += r.width + SIBLING_GAP;
      layoutSubtree(r.id, cx, visitedGlobal);
    }

    const layoutedNodes = nodes.map((node) => {
      const pos = positions.get(node.id);
      if (!pos) {
        const m = memberMap.get(node.id);
        return {
          ...node,
          position: {
            x: node.position.x ?? 0,
            y: node.position.y ?? (m?.generation ?? 0) * RANK_SEP,
          },
        };
      }
      return {
        ...node,
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  };

  const onLayout = () => {
    const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);

    const updatedMembers = draft.members.map((m) => {
      // Tìm node tương ứng đã được Dagre tính toán vị trí
      const layoutedNode = layoutedNodes.find((n) => n.id === m.localId);
      return {
        ...m,
        // Cập nhật tọa độ mới vào member (bạn cần thêm trường x, y vào ICreateFamilyMemberDto)
        positionX: layoutedNode?.position.x,
        positionY: layoutedNode?.position.y,
      };
    });
    dispatch(setDraft({ ...draft, members: updatedMembers }));

    // Đợi nodes cập nhật vị trí mới rồi fit view vào toàn bộ sơ đồ
    setLayoutVersion((v) => v + 1);
    //console.log("Sơ đồ đã được cập nhật tọa độ vào Draft!");
  };

  const onNodeDragStop = (event: React.MouseEvent, node: Node) => {
    // Lấy bản draft hiện tại từ store và cập nhật thành viên bị kéo
    const updatedMember = draft.members.map((m) =>
      m.localId === node.id
        ? { ...m, positionX: node.position.x, positionY: node.position.y }
        : m,
    );

    // Gửi bản draft đã cập nhật tọa độ vào Redux
    dispatch(setDraft({ ...draft, members: updatedMember }));
  };

  useEffect(() => {
    if (family) {
      dispatch(setOrigin(family));
    }
  }, [dispatch, family]);

  useEffect(() => {
    if (group && "id" in group) {
      const myMember = group.groupMembers.find(
        (m) => m.member.userProfile.userId === profile?.id,
      );
      if (myMember) {
        setPinnedMemberId(myMember.pinnedMemberId ?? null);
      }
    }
  }, [group, profile]);

  const labels = useMemo(() => {
    if (!pinnedMemberId) return new Map<string, string>();
    return computeLabels(pinnedMemberId, draft);
  }, [pinnedMemberId, draft]);

  useEffect(() => {
    if (draft && draft.members && draft.family.localId.length !== 0) {
      const { nodes: flowNodes, edges: flowEdges } = mapDraftToFlow(
        draft,
        "familyNode",
        labels,
      );
      const nodesWithPinned = flowNodes.map((node) => ({
        ...node,
        data: { ...node.data, isPinned: node.id === pinnedMemberId },
      }));
      setNodes(nodesWithPinned);
      setEdges(flowEdges);
    }
  }, [draft, labels, pinnedMemberId, setNodes, setEdges]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Kiểm tra logic isDirty từ Redux
      // Lưu ý: isDirty = !isEqual(draft, origin)
      if (!isEqual(draft, origin)) {
        const message =
          "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?";
        e.preventDefault();
        e.returnValue = message; // Hiển thị thông báo chuẩn của trình duyệt
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [draft]);

  if (group && "id" in group) {
    const canManage = group.groupMembers.some(
      (m) =>
        m.member.userProfile.userId === profile.id &&
        (m.role === MEMBER_ROLE.OWNER || m.role === MEMBER_ROLE.EDITOR),
    );

    return (
      <div
        ref={constrainRef}
        className={"relative h-[calc(100vh-3.5rem)] w-full overflow-hidden"}
      >
        <PanelEditor
          constraintsRef={constrainRef}
          setOpenFamilyForm={setOpenFamilyForm}
          setOpenFamilyMemberForm={setOpenFamilyMemberForm}
          setOpenRelationshipForm={setOpenRelationForm}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          onLayout={onLayout}
          nodesDraggable={nodesDraggable}
          setNodesDraggable={setNodesDraggable}
          groupId={group.id}
        />
        {/* this section is for settings, info and other actions related to the family tree. It is fixed on the top right corner of the screen and contains drawers for family info and settings. */}
        <div className={"w-fit fixed top-20 right-5 z-50 flex flex-col gap-3"}>
          <EventCalendar
            groupId={group.id}
            onSelectDay={(date) => {
              setSelectedDay(date);
              setOpenDayDialog(true);
            }}
          />
          <FamilyInfoDrawer data={group} />
          <FamilySettingDrawer data={group} />
        </div>

        {selectedDay && (
          <DayEventsDialog
            groupId={group.id}
            canManage={canManage}
            date={selectedDay}
            openState={openDayDialog}
            setOpenState={setOpenDayDialog}
          />
        )}

        {openFamilyMemberForm && (
          <NewFamilyMemberForm
            currentData={editingMember}
            setCurrentData={setEditingMember}
            openState={openFamilyMemberForm}
            setOpenState={setOpenFamilyMemberForm}
            groupId={group.id}
            pinnedMemberId={pinnedMemberId}
            setPinnedMemberId={setPinnedMemberId}
          />
        )}
        {openFamilyForm && (
          <NewFamilyForm
            openState={openFamilyForm}
            setOpenState={setOpenFamilyForm}
          />
        )}
        {openRelationForm && (
          <RelationshipForm
            openState={openRelationForm}
            setOpenState={setOpenRelationForm}
            setCurrentData={setEditingRelation}
            currentData={editingRelation}
            prefillMemberIds={prefillRelation}
            memberNameMap={memberNameMap}
          />
        )}
        <div className={"w-full h-full border bg-slate-50"}>
          <ReactFlowProvider>
            <FlowFitView layoutVersion={layoutVersion} nodes={nodes} />
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              connectionRadius={60}
              nodeTypes={nodeTypes}
              fitView
              onNodeDoubleClick={onNodeDoubleClick}
              onEdgeClick={onEdgeClick}
              nodesDraggable={nodesDraggable}
              onNodeDragStop={onNodeDragStop}
            >
              {showGrid && (
                <Background variant={BackgroundVariant.Dots} gap={20} />
              )}{" "}
              <Controls />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    );
  }
};
