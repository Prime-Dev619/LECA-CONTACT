import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import marketplaceReducer from './slices/marketplaceSlice';
import ordersReducer from './slices/ordersSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    marketplace: marketplaceReducer,
    orders: ordersReducer,
    chat: chatReducer,
  },
});

export const selectAuth = (state) => state.auth;
