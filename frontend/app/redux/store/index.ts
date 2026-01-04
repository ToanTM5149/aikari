/**
 * Redux Store Configuration
 * 
 * File này là trung tâm của Redux store, nơi:
 * 1. Kết hợp tất cả reducers (rootReducer)
 * 2. Cấu hình middleware (RTK Query, logger, etc.)
 * 3. Setup DevTools cho development
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

// Import các slice reducers từ features
import authReducer from '../features/auth/slice';
import userReducer from '../features/user/slice';
import learningReducer from '../features/learning/slice';

// Import RTK Query base API
import { baseApi } from './api/baseApi';

// Import các API endpoints để inject vào baseApi
import '../features/auth/api';
import '../features/user/api';
import '../features/class/api';
import '../features/learning/api';
import '../features/test/api';
import '../features/chatbot/api';

/**
 * Root Reducer - Kết hợp tất cả reducers
 * 
 * Mỗi key trong object này sẽ trở thành một "slice" trong Redux state
 * Ví dụ: state.auth, state.user, state.api
 */
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  learning: learningReducer,
  // RTK Query reducer - tự động quản lý cache, loading states
  [baseApi.reducerPath]: baseApi.reducer,
});

/**
 * Configure Store với Redux Toolkit
 * 
 * configureStore tự động setup:
 * - Redux DevTools Extension
 * - Redux Thunk middleware (cho async actions)
 * - Serializable check middleware (cảnh báo nếu state không serializable)
 * - Immutability check middleware (cảnh báo nếu mutate state trực tiếp)
 */
export const store = configureStore({
  reducer: rootReducer,
  
  // Middleware configuration
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Tùy chọn middleware mặc định
      serializableCheck: {
        // Ignore các action paths có thể chứa non-serializable values
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(
      // Thêm RTK Query middleware để enable caching, invalidation, polling, etc.
      baseApi.middleware
    ),
  
  // Enable Redux DevTools trong development mode
  devTools: process.env.NODE_ENV !== 'production',
});

/**
 * Type Definitions
 * 
 * Các types này giúp TypeScript hiểu cấu trúc của Redux store
 * và cung cấp autocomplete + type checking cho toàn bộ app
 */

// RootState type - Mô tả cấu trúc toàn bộ Redux state
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch type - Mô tả type của dispatch function (bao gồm async actions)
export type AppDispatch = typeof store.dispatch;

/**
 * Typed Hooks
 * 
 * Pre-typed versions of useDispatch and useSelector
 * Use throughout the app instead of plain `useDispatch` and `useSelector`
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Store Setup Status Hook
 * 
 * Hook này giúp kiểm tra xem store đã được setup chưa
 * Hữu ích cho SSR hoặc testing
 */
export const useStore = () => store;

export default store;
