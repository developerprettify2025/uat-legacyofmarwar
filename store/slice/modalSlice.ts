import { createSlice } from "@reduxjs/toolkit";

export const modalSlice = createSlice({
  name: "modal",
  initialState: {
    isModal: null,
    modalData: null,
  },
  reducers: {
    setIsModal: (state, action) => {
      state.isModal = action.payload;
    },
    setModalData: (state, action) => {
      state.modalData = action.payload;
    },
  },
});

export const { setIsModal, setModalData } = modalSlice.actions;
export default modalSlice.reducer;
