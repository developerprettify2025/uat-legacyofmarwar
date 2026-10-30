import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  user: null,
  accounts: [],
  isLoggedIn: false,
  loading: false,
  error: null,
};

const authuserReducer = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action) {
      if (action.payload?.user !== undefined) {
        state.user = action.payload.user;
      }

      if (action.payload?.accounts !== undefined) {
        state.accounts = action.payload.accounts;
      }

      if (action.payload?.loginMethod) {
        state.loginMethod = action.payload.loginMethod;
      }

      state.isLoggedIn = true;
    },

    setAccounts(state, action) {
      state.accounts = action.payload || [];
    },

    switchProfile(state, action) {
      state.user = action.payload;
    },

    logout(state) {
      state.user = null;
      state.accounts = [];
      state.loginMethod = null;
      state.isLoggedIn = false;
      state.loading = false;
      state.error = null;
    },

    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },

    updateWishlistCount(state, action) {
      const totalWishlist = Number(action.payload) || 0;

      if (state.user) {
        state.user.TotalWishlist = totalWishlist;
      }

      state.accounts = state.accounts.map((account) => ({
        ...account,
        TotalWishlist: totalWishlist,
      }));
    },
  },
});

export const {
  login,
  logout,
  setAccounts,
  switchProfile,
  updateUser,
  updateWishlistCount,
} = authuserReducer.actions;
export default authuserReducer.reducer;