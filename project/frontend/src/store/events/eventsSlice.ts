import { createSlice } from "@reduxjs/toolkit";

interface EventsState {
  refreshKey: number;
}

const initialState: EventsState = {
  refreshKey: 0,
};

export const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    refreshEvents: (state) => {
      state.refreshKey += 1;
    },
  },
});

export const { refreshEvents } = eventsSlice.actions;
export default eventsSlice.reducer;
