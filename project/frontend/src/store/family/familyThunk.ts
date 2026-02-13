import { createAsyncThunk } from "@reduxjs/toolkit";
import isEqual from "lodash.isequal";
import { SyncFamilyAction } from "@/modules/family/family.actions";
import { RootState } from "@/store";
import { syncSuccess } from "./familySlice";
export const saveFamilyDraft = createAsyncThunk(
  "family/save",
  async (groupId: string, { getState, dispatch }) => {
    const { draft, origin } = (getState() as RootState).family;

    // So sánh ngay tại đây bằng lodash.isequal
    if (isEqual(draft, origin)) return;

    const result = await SyncFamilyAction(groupId, draft);
    dispatch(syncSuccess());
    return result;
  },
);
