/**
 * Base API Service
 * 
 * RTK Query base API với baseQuery và reauth logic
 * Các features sẽ inject endpoints vào đây
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Type definition để tránh circular dependency
// RootState sẽ được định nghĩa trong store/index.ts sau khi store được tạo
type RootState = {
  auth: {
    accessToken: string | null;
    refreshToken: string | null;
    user: any;
  };
  [key: string]: any;
};

/**
 * Base Query với Auth Token
 * 
 * Tự động thêm Authorization header vào mọi request
 * 
 * ⚠️ SECURITY: credentials: 'include' để gửi HTTP-only cookies
 * Điều này cần thiết để refresh token cookie được gửi tự động
 * 
 * ⚠️ COOKIE FIX: Sử dụng relative path để dùng Vite proxy
 * Proxy giúp frontend và backend cùng origin → cookie hoạt động đúng
 */
const baseQuery = fetchBaseQuery({
  // Sử dụng relative path để dùng Vite proxy trong dev
  // Production: có thể dùng VITE_API_URL từ env
  baseUrl: import.meta.env.DEV 
    ? '/api/v1'  // Dev: dùng Vite proxy → cùng origin với frontend
    : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`, 
  credentials: 'include',
  
  /**
   * Prepare Headers
   * Tự động thêm Authorization header nếu có token
   */
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

/**
 * Base Query với Retry Logic
 * 
 * Tự động retry request nếu token expired
 * Refresh token và retry request
 * 
 * ⚠️ SECURITY: Refresh token KHÔNG gửi trong body
 * Cookie HTTP-only tự động được gửi với mọi request
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Nếu response là 401 (Unauthorized) => token expired
  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: '/login/refresh-token',
        method: 'POST',
      },
      api,
      extraOptions
    );
    
    if (refreshResult.data) {
      const newToken = (refreshResult.data as any).access_token;
      const state = api.getState() as RootState;
  
      // Dispatch action to update token in store
      api.dispatch({
        type: 'auth/setCredentials',
        payload: { 
          accessToken: newToken,
          user: state.auth.user,
        },
      });
      
      // Retry original request với new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed => logout
      api.dispatch({ type: 'auth/logout' });
    }
  }
  
  return result;
};

/**
 * Base API Service
 * 
 * Empty endpoints - các features sẽ inject endpoints vào đây
 */
export const baseApi = createApi({
  reducerPath: 'api', // Key trong Redux state
  baseQuery: baseQueryWithReauth,
  
  /**
   * Tag Types
   * 
   * Tags dùng cho cache invalidation
   * Khi một mutation thành công, có thể invalidate tags để trigger refetch
   */
  tagTypes: ['User', 'Class', 'Flashcard', 'Study'],
  
  /**
   * Endpoints
   * 
   * Empty - sẽ được inject bởi các features
   */
  endpoints: () => ({}),
});

