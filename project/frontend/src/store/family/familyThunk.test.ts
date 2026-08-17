import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { LINEAGE_TYPE } from "@prisma/client";
import familyReducer from "./familySlice";
import { deleteFamily, saveFamilyDraft } from "./familyThunk";
import type { IDraftFamilyData } from "@/types/draft.types";

const { SyncFamilyAction, DeleteFamilyAction } = vi.hoisted(() => ({
  SyncFamilyAction: vi.fn(),
  DeleteFamilyAction: vi.fn(),
}));

vi.mock("@/modules/family/family.actions", () => ({
  SyncFamilyAction,
  DeleteFamilyAction,
}));

vi.mock("@prisma/client", () => ({
  LINEAGE_TYPE: {
    PATRIARCHAL: "PATRIARCHAL",
    MATRIARCHAL: "MATRIARCHAL",
    OTHER: "OTHER",
  },
}));

const emptyDraft: IDraftFamilyData = {
  members: [],
  relationships: [],
  family: { localId: "", name: "", lineageType: LINEAGE_TYPE.PATRIARCHAL },
};

const draftWithMember: IDraftFamilyData = {
  ...emptyDraft,
  members: [
    {
      localId: "member-1",
      fullName: "Nguyen Van A",
      gender: "MALE",
      generation: 1,
    },
  ],
};

const createStore = (
  preloaded: Partial<{ draft: IDraftFamilyData; origin: IDraftFamilyData }>,
) =>
  configureStore({
    reducer: { family: familyReducer },
    preloadedState: {
      family: {
        draft: emptyDraft,
        origin: emptyDraft,
        ...preloaded,
      },
    },
  });

describe("familyThunk", () => {
  beforeEach(() => {
    SyncFamilyAction.mockReset();
    DeleteFamilyAction.mockReset();
  });

  describe("saveFamilyDraft", () => {
    it("skips the API call when draft equals origin", async () => {
      const store = createStore({ draft: emptyDraft, origin: emptyDraft });

      await store.dispatch(saveFamilyDraft("group-1") as never);

      expect(SyncFamilyAction).not.toHaveBeenCalled();
    });

    it("calls SyncFamilyAction and copies draft to origin on success", async () => {
      SyncFamilyAction.mockResolvedValue({ ...draftWithMember });
      const store = createStore({
        draft: draftWithMember,
        origin: emptyDraft,
      });

      const result = (await store.dispatch(
        saveFamilyDraft("group-1") as never,
      )) as { type: string };

      expect(SyncFamilyAction).toHaveBeenCalledWith("group-1", draftWithMember);
      expect(result.type).toBe("family/save/fulfilled");
      expect(store.getState().family.origin).toEqual(draftWithMember);
    });

    it("rejects when SyncFamilyAction fails", async () => {
      SyncFamilyAction.mockResolvedValue(null);
      const store = createStore({
        draft: draftWithMember,
        origin: emptyDraft,
      });

      const result = (await store.dispatch(
        saveFamilyDraft("group-1") as never,
      )) as { type: string };

      expect(result.type).toBe("family/save/rejected");
      expect(store.getState().family.origin).toEqual(emptyDraft);
    });
  });

  describe("deleteFamily", () => {
    it("deletes the family and resets the draft", async () => {
      DeleteFamilyAction.mockResolvedValue({ id: "family-1" });
      const store = createStore({
        draft: {
          ...emptyDraft,
          family: {
            localId: "family-1",
            name: "Nguyen Family",
            lineageType: LINEAGE_TYPE.PATRIARCHAL,
          },
        },
      });

      const result = (await store.dispatch(
        deleteFamily("group-1") as never,
      )) as { type: string };

      expect(DeleteFamilyAction).toHaveBeenCalledWith("family-1", "group-1");
      expect(result.type).toBe("family/delete/fulfilled");
      expect(store.getState().family.draft).toEqual(emptyDraft);
    });

    it("rejects when the family cannot be deleted", async () => {
      DeleteFamilyAction.mockResolvedValue(null);
      const store = createStore({
        draft: {
          ...emptyDraft,
          family: {
            localId: "family-1",
            name: "Nguyen Family",
            lineageType: LINEAGE_TYPE.PATRIARCHAL,
          },
        },
      });

      const result = (await store.dispatch(
        deleteFamily("group-1") as never,
      )) as { type: string };

      expect(result.type).toBe("family/delete/rejected");
    });
  });
});
