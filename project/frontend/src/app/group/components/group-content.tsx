"use client";
import { ResponseGroupFamilyDetailDto } from "@/modules/group-family/group-family.dto";
import { FamilyInfoDrawer } from "./family-info-drawer";
import { PanelEditor } from "./panel-editor";
import { useEffect, useMemo, useRef, useState } from "react";
import NewFamilyMemberForm from "./forms/new-family-member-form";
import { IDraftFamilyData } from "@/types/draft.types";
import NewFamilyForm from "./forms/new-family-form";
import { mapDraftToFlow } from "@/lib/utils";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FamilyMemberNode } from "./react-flow/family-member-node";
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
  const [openFamilyMemberForm, setOpenFamilyMemberForm] =
    useState<boolean>(false);

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
  const { nodes, edges } = useMemo(
    () => mapDraftToFlow(draft, "familyNode"),
    [draft],
  );

  useEffect(() => {
    console.log("draft: ", draft);
  }, [draft]);

  return (
    <div ref={constrainRef} className="relative min-h-screen w-full">
      <PanelEditor
        constraintsRef={constrainRef}
        setOpenFamilyForm={setOpenFamilyForm}
        setOpenFamilyMemberForm={setOpenFamilyMemberForm}
      />
      <FamilyInfoDrawer data={data} />
      {openFamilyMemberForm && (
        <NewFamilyMemberForm
          openState={openFamilyMemberForm}
          setOpenState={setOpenFamilyMemberForm}
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
      <div className="w-full h-full border bg-slate-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          // Vô hiệu hóa kéo node nếu bạn muốn chỉ dùng Panel để sửa
          // nodesDraggable={true}
        >
          <Background color="#ccc" gap={20} />
          <Controls />
        </ReactFlow>
      </div>{" "}
    </div>
  );
};
