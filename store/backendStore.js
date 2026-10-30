import { configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "./backendSlice/authReducer";
import modalReducer from "./slice/modalSlice";
import uiReducer from "./slice/uiSlice";
import { authAPISlice } from "./backendSlice/authAPISlice";
import authuserReducer from "./slice/authSlice";
import { staticAPISlice } from "./backendSlice/staticAPISlice";
import { contactUsAPISlice } from "./backendSlice/contactUsAPISlice";
import { blogAPISlice } from "./backendSlice/blogAPISlice";
import { categoryAPISlice } from "./backendSlice/categoryAPISlice";
import { occasionAPISlice } from "./backendSlice/occasionAPISlice";
import { productAPISlice } from "./backendSlice/productAPISlice";
import { homePageAPISlice } from "./frontendSlice/homePageAPISlice";
import { reportSummaryAPISlice } from "./backendSlice/reportSummaryAPISlice";
import { mediaAPISlice } from "./backendSlice/mediaAPISlice";
import { colorAPISlice } from "./backendSlice/colorAPISlice";
import { customerAPISlice } from "./backendSlice/customerAPISlice";
import { customerShippingAddressAPISlice } from "./backendSlice/customerShippingAddressAPISlice";
import { couponAPISlice } from "./backendSlice/couponAPISlice";
import { customerWishlistAPISlice } from "./backendSlice/customerWishlistAPISlice";
import { customerOrderAPISlice } from "./backendSlice/customerOrderAPISlice";

const authPersistConfig = {
  key: "authuserReducer",
  storage,
  whitelist: ["user", "isLoggedIn", "accounts"],
};

export const backendStore = configureStore({
  reducer: {
    backendAuth: authReducer, // renamed: "auth" was defined twice
    modal: modalReducer,
    ui: uiReducer,
    [authAPISlice.reducerPath]: authAPISlice.reducer,
    [staticAPISlice.reducerPath]: staticAPISlice.reducer,
    [contactUsAPISlice.reducerPath]: contactUsAPISlice.reducer,
    [blogAPISlice.reducerPath]: blogAPISlice.reducer,
    [categoryAPISlice.reducerPath]: categoryAPISlice.reducer,
    [occasionAPISlice.reducerPath]: occasionAPISlice.reducer,
    [productAPISlice.reducerPath]: productAPISlice.reducer,
    [homePageAPISlice.reducerPath]: homePageAPISlice.reducer,
    [reportSummaryAPISlice.reducerPath]: reportSummaryAPISlice.reducer,
    [mediaAPISlice.reducerPath]: mediaAPISlice.reducer,
    [colorAPISlice.reducerPath]: colorAPISlice.reducer,
    [customerAPISlice.reducerPath]: customerAPISlice.reducer,
    [customerShippingAddressAPISlice.reducerPath]:
      customerShippingAddressAPISlice.reducer,
    [couponAPISlice.reducerPath]: couponAPISlice.reducer,
    [customerWishlistAPISlice.reducerPath]: customerWishlistAPISlice.reducer,
    [customerOrderAPISlice.reducerPath]: customerOrderAPISlice.reducer,
    auth: persistReducer(authPersistConfig, authuserReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authAPISlice.middleware,
      staticAPISlice.middleware,
      contactUsAPISlice.middleware,
      blogAPISlice.middleware,
      categoryAPISlice.middleware,
      occasionAPISlice.middleware,
      productAPISlice.middleware,
      homePageAPISlice.middleware,
      reportSummaryAPISlice.middleware,
      mediaAPISlice.middleware,
      colorAPISlice.middleware,
      customerAPISlice.middleware,
      customerShippingAddressAPISlice.middleware,
      couponAPISlice.middleware,
      customerWishlistAPISlice.middleware,
      customerOrderAPISlice.middleware,
    ),
});

export const persistor = persistStore(backendStore);
setupListeners(backendStore.dispatch);