/**
 * Redux Store Configuration
 * 
 * File này là trung tâm của Redux store, nơi:
 * 1. Kết hợp tất cả reducers (rootReducer)
 * 2. Cấu hình middleware (RTK Query, logger, etc.)
 * 3. Setup DevTools cho development
 * 4. Export hooks typed (useAppDispatch, useAppSelector)
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';

// Import các slice reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';

// Import RTK Query API services
import { apiService } from './services/apiService';

/**
 * Root Reducer - Kết hợp tất cả reducers
 * 
 * Mỗi key trong object này sẽ trở thành một "slice" trong Redux state
 * Ví dụ: state.auth, state.user, state.api
 */
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  // RTK Query reducer - tự động quản lý cache, loading states
  [apiService.reducerPath]: apiService.reducer,
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
      apiService.middleware
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
 * Typed Hooks - Pre-typed versions of useDispatch and useSelector
 * 
 * Thay vì dùng useDispatch và useSelector thông thường,
 * dùng các hooks này để có type safety và autocomplete
 * 
 * Usage:
 * ```tsx
 * const dispatch = useAppDispatch();
 * const user = useAppSelector((state) => state.user.currentUser);
 * ```
 */

// useAppDispatch - Typed version of useDispatch
export const useAppDispatch: () => AppDispatch = useDispatch;

// useAppSelector - Typed version of useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Store Setup Status Hook
 * 
 * Hook này giúp kiểm tra xem store đã được setup chưa
 * Hữu ích cho SSR hoặc testing
 */
export const useStore = () => store;

export default store;
