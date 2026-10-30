import { createSlice } from "@reduxjs/toolkit";

export const uiSlice = createSlice({
  name: "ui",
  initialState: {
    isHeaderBlue: false,
  },
  reducers: {
    setIsHeaderBlue: (state, action) => {
      state.isHeaderBlue = action.payload;
    },
  },
});

export const { setIsHeaderBlue } = uiSlice.actions;
export default uiSlice.reducer;
