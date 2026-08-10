import { createAsyncThunk } from "@reduxjs/toolkit";
import isEqual from "lodash.isequal";
import {
  DeleteFamilyAction,
  SyncFamilyAction,
} from "@/modules/family/family.actions";
import { RootState } from "@/store";
import { deleteAll, syncSuccess } from "./familySlice";
export const saveFamilyDraft = createAsyncThunk(
  "family/save",
  async (groupId: string, { getState, dispatch, rejectWithValue }) => {
    const { draft, origin } = (getState() as RootState).family;

    // So sánh ngay tại đây bằng lodash.isequal
    if (isEqual(draft, origin)) return;

    const result = await SyncFamilyAction(groupId, draft);

    if (result === null || ("success" in result && result.success === false)) {
      return rejectWithValue(
        result ?? { message: "Không thể lưu bản nháp.", code: 500 },
      );
    }

    dispatch(syncSuccess());
    return result;
  },
);

export const deleteFamily = createAsyncThunk(
  "family/delete",
  async (groupId: string, { getState, dispatch, rejectWithValue }) => {
    const { draft } = (getState() as RootState).family;
    const result = await DeleteFamilyAction(draft.family.localId, groupId);

    if (typeof result !== "object" || result === null || !("id" in result)) {
      return rejectWithValue(
        result !== null
          ? result
          : { message: "Không thể xóa bản nháp.", code: 500 },
      );
    }

    dispatch(deleteAll());
    return result;
  },
);
