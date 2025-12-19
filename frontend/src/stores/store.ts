import { configureStore } from '@reduxjs/toolkit';
import { authReducer, chatReducer, errorReducer } from './slices';

/**
 * Redux store configuration
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    error: errorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

