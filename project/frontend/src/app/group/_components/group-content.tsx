"use client";
import { IResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { FamilyInfoDrawer } from "./family-info-drawer";
import { PanelEditor } from "./menu-editor/panel-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NewFamilyMemberForm from "./forms/family-member-form";
import { IDraftFamilyData } from "@/types/draft.types";
import NewFamilyForm from "./forms/new-family-form";
import { mapDraftToFlow } from "@/lib/utils";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FamilyMemberNode } from "./react-flow/family-member-node";
import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import RelationshipForm from "./forms/relationship-form";
import { IRelationshipDto } from "@/modules/relationships/relationship.dto";
import dagre from "@dagrejs/dagre";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { setDraft, setOrigin } from "@/store/family/familySlice";
import isEqual from "lodash.isequal";
import FamilySettingDrawer from "./family-setting-drawer";
import { ApiResponse } from "@/types/api.types";
import { EventCalendar } from "./event-calendar";
import { DayEventsDialog } from "./day-events-dialog";
import { MEMBER_ROLE } from "@/types/enums";
import { Toaster } from "@/components/shared/toast";

const nodeTypes = {
  familyNode: FamilyMemberNode,
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
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  if (!openRelationForm && editingRelation !== null) setEditingRelation(null);
  if (!openRelationForm && prefillRelation !== null) setPrefillRelation(null);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [openDayDialog, setOpenDayDialog] = useState<boolean>(false);

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
    setConnectingFrom(null);
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

  const onConnectStart = useCallback(
    (_: MouseEvent | TouchEvent, params: { nodeId: string | null }) => {
      setConnectingFrom(params.nodeId);
    },
    [],
  );

  const onConnectEnd = useCallback(() => {
    setConnectingFrom(null);
  }, []);

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
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: "TB",
      nodesep: 50,
      ranker: "tight-tree",
    });

    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.data.gender === "MALE" && b.data.gender === "FEMALE") return -1;
      if (a.data.gender === "FEMALE" && b.data.gender === "MALE") return 1;
      return 0;
    });
    sortedNodes.forEach((node) => {
      dagreGraph.setNode(node.id, {
        width: 150,
        height: 50,
        rank: node.data.generation, // Sử dụng generation để ép hàng ngang
      });
    });

    edges.forEach((edge) => {
      // Lưu ý: React Flow Edge dùng 'source' và 'target'
      if (edge.label === "SPOUSE") {
        const virtualNodeId = `v_${edge.source}_${edge.target}`;
        dagreGraph.setNode(virtualNodeId, { width: 1, height: 1 });

        // Tìm node cha (Male) để ưu tiên vị trí
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const isMaleSource = sourceNode?.data.gender === "MALE";

        // Tăng weight cho phía Male để Dagre ưu tiên kéo node này về gần trục giữa hơn
        dagreGraph.setEdge(edge.source, virtualNodeId, {
          weight: isMaleSource ? 20 : 10,
          minlen: 1,
        });
        dagreGraph.setEdge(edge.target, virtualNodeId, {
          weight: isMaleSource ? 10 : 20,
          minlen: 1,
        });

        // Nối từ điểm ảo xuống con cái [cite: 23]
        const children = draft.relationships.filter(
          (r) =>
            r.type === "CHILD" &&
            (r.fromMemberId === edge.source || r.fromMemberId === edge.target),
        );

        children.forEach((child) => {
          dagreGraph.setEdge(virtualNodeId, child.toMemberId);
        });
      } else if (edge.label !== "CHILD") {
        // Nếu là các quan hệ khác không qua node trung gian
        dagreGraph.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: { x: nodeWithPosition.x - 75, y: nodeWithPosition.y - 25 },
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
    if (draft && draft.members && draft.family.localId.length !== 0) {
      const { nodes: flowNodes, edges: flowEdges } = mapDraftToFlow(
        draft,
        "familyNode",
      );
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [draft, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, connectingFrom },
      })),
    );
  }, [connectingFrom, setNodes]);

  useEffect(() => {
    if (family) {
      dispatch(setOrigin(family));
    }
  }, [dispatch, family]);

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
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            connectionRadius={60}
            nodeTypes={nodeTypes}
            fitView
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            nodesDraggable={nodesDraggable}
            onNodeDragStop={onNodeDragStop}
            // Vô hiệu hóa kéo node nếu bạn muốn chỉ dùng Panel để sửa
            // nodesDraggable={true}
          >
            {showGrid && (
              <Background variant={BackgroundVariant.Dots} gap={20} />
            )}{" "}
            <Controls />
          </ReactFlow>
        </div>
      </div>
    );
  }
};
