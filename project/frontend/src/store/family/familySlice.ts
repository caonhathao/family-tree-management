import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";
import { IDraftFamilyData } from "@/types/draft.types";
import { LINEAGE_TYPE } from "@prisma/client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FamilyState {
  draft: IDraftFamilyData;
  origin: IDraftFamilyData;
}

const initialState: FamilyState = {
  draft: {
    members: [],
    relationships: [],
    family: { localId: "", name: "", lineageType: LINEAGE_TYPE.PATRIARCHAL },
  },
  origin: {
    members: [],
    relationships: [],
    family: { localId: "", name: "", lineageType: LINEAGE_TYPE.PATRIARCHAL },
  },
};

const familySlice = createSlice({
  name: "family",
  initialState,
  reducers: {
    setDraft: (state, action) => {
      state.draft = action.payload;
    },
    updateMemberInDraft: (state, action: PayloadAction<IFamilyMemberDto>) => {
      state.draft.members = state.draft.members.map((m) =>
        m.localId === action.payload.localId ? action.payload : m,
      );
    },
    deleteAll: (state) => {
      state.draft = initialState.draft;
      state.origin = initialState.origin;
    },
    setOrigin: (state, action) => {
      const data = JSON.parse(JSON.stringify(action.payload));
      state.origin = data;
      state.draft = data;
    },
    syncSuccess: (state) => {
      state.origin = JSON.parse(JSON.stringify(state.draft));
    },
  },
});

export const {
  setDraft,
  setOrigin,
  updateMemberInDraft,
  deleteAll,
  syncSuccess,
} = familySlice.actions;
export default familySlice.reducer;
