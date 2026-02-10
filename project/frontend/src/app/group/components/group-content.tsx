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

const nodeTypes = {
  familyNode: FamilyMemberNode, // Đăng ký 'familyNode'
};

export const GroupContentPage = ({
  data,
}: {
  data: ResponseGroupFamilyDetailDto;
}) => {
  const constrainRef = useRef<HTMLDivElement>(null);
  const [openFamilyForm, setOpenFamilyForm] = useState<boolean>(false);
  const [openRelationForm, setOpenRelationForm] = useState<boolean>(false);
  const [openFamilyMemberForm, setOpenFamilyMemberForm] =
    useState<boolean>(false);
  const [showGrid, setShowGrid] = useState(true);
  const [nodesDraggable, setNodesDraggable] = useState(true);
  const [editingMember, setEditingMember] =
    useState<IFamilyMemberDto | null>(null);
  if (!openFamilyMemberForm && editingMember !== null) setEditingMember(null);

  const [editingRelation, setEditingRelation] =
    useState<IRelationshipDto | null>(null);
  if (!openRelationForm && editingRelation !== null) setEditingRelation(null);

  //create raw data sate
  const [draft, setDraft] = useState<IDraftFamilyData>({
    member: [],
    relationships: [],
    family: {
      localId: "",
      name: "",
      description: "",
    },
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const { nodes: flowNodes, edges: flowEdges } = mapDraftToFlow(
      draft,
      "familyNode",
    );
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [draft, setNodes, setEdges]);

  const onNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    const member = draft.member.find((m) => m.localId === node.id);
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
    dagreGraph.setGraph({ rankdir: "TB", nodesep: 100, ranksep: 150 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, {
        width: 150,
        height: 50,
        rank: node.data.generation, // Sử dụng generation để ép hàng ngang [cite: 34]
      });
    });

    edges.forEach((edge) => {
      // Lưu ý: React Flow Edge dùng 'source' và 'target'
      if (edge.label === "SPOUSE") {
        // Hoặc dựa trên logic loại quan hệ của bạn [cite: 3, 35]
        const virtualNodeId = `v_${edge.source}_${edge.target}`;

        dagreGraph.setNode(virtualNodeId, { width: 1, height: 1 });

        // Ép trọng số cao để Cha và Mẹ nằm sát nhau trên cùng 1 hàng
        dagreGraph.setEdge(edge.source, virtualNodeId, { weight: 10 });
        dagreGraph.setEdge(edge.target, virtualNodeId, { weight: 10 });

        // Tìm con cái dựa trên danh sách quan hệ trong draft
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

    setDraft((prev) => ({
      ...prev,
      member: prev.member.map((m) => {
        // Tìm node tương ứng đã được Dagre tính toán vị trí
        const layoutedNode = layoutedNodes.find((n) => n.id === m.localId);
        return {
          ...m,
          // Cập nhật tọa độ mới vào member (bạn cần thêm trường x, y vào ICreateFamilyMemberDto)
          positionX: layoutedNode?.position.x,
          positionY: layoutedNode?.position.y,
        };
      }),
    }));

    console.log("Sơ đồ đã được cập nhật tọa độ vào Draft!");
  };

  const onNodeDragStop = (event: React.MouseEvent, node: Node) => {
    setDraft((prev) => ({
      ...prev,
      member: prev.member.map((m) =>
        m.localId === node.id
          ? { ...m, positionX: node.position.x, positionY: node.position.y }
          : m,
      ),
    }));
  };

  useEffect(() => {
    console.log("draft: ", draft);
  }, [draft]);

  return (
    <div ref={constrainRef} className="relative min-h-screen w-full">
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
      />
      <FamilyInfoDrawer data={data} />
      {openFamilyMemberForm && (
        <NewFamilyMemberForm
          currentData={editingMember}
          setCurrentData={setEditingMember}
          openState={openFamilyMemberForm}
          setOpenState={setOpenFamilyMemberForm}
          draft={draft}
          setDraft={setDraft}
        />
      )}
      {openFamilyForm && (
        <NewFamilyForm
          openState={openFamilyForm}
          setOpenState={setOpenFamilyForm}
          draft={draft}
          setDraft={setDraft}
        />
      )}
      {openRelationForm && (
        <RelationshipForm
          draft={draft}
          openState={openRelationForm}
          setOpenState={setOpenRelationForm}
          setDraft={setDraft}
          setCurrentData={setEditingRelation}
          currentData={editingRelation}
        />
      )}
      <div className="w-full h-full border bg-slate-50">
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
