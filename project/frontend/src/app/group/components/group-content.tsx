"use client";
import { ResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { FamilyInfoDrawer } from "./family-info-drawer";
import { PanelEditor } from "./panel-editor";
import { useEffect, useRef, useState } from "react";
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

const nodeTypes = {
  familyNode: FamilyMemberNode, // Đăng ký 'familyNode'
};

export const GroupContentPage = ({
  group,
  family,
}: {
  group: ResponseGroupFamilyDetailDto;
  family: IDraftFamilyData | null;
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
  if (!openRelationForm && editingRelation !== null) setEditingRelation(null);

  const { draft } = useSelector((state: RootState) => state.family);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

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

  const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: "TB",
      nodesep: 50,
      ranksep: 80,
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

    console.log("Sơ đồ đã được cập nhật tọa độ vào Draft!");
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
    console.log("draft: ", draft);
    console.log("family: ", family);
  }, [draft, family]);

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
      <div className={"fixed top-20 right-5 z-50"}>
        <FamilyInfoDrawer data={group} />
      </div>
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
        />
      )}
      <div className={"w-full h-full border bg-slate-50"}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeClick={onEdgeClick}
          nodesDraggable={nodesDraggable}
          onNodeDragStop={onNodeDragStop}
          // Vô hiệu hóa kéo node nếu bạn muốn chỉ dùng Panel để sửa
          // nodesDraggable={true}
        >
          {showGrid && <Background variant={BackgroundVariant.Dots} gap={20} />}{" "}
          <Controls />
        </ReactFlow>
      </div>{" "}
    </div>
  );
};
