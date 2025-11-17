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
 */
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`,
  
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
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Nếu response là 401 (Unauthorized) => token expired
  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;
    
    if (refreshToken) {
      // Call refresh token endpoint
      const refreshResult = await baseQuery(
        {
          url: '/login/refresh-token',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Store new token
        const newToken = (refreshResult.data as any).access_token;
        localStorage.setItem('access_token', newToken);
        
        // Dispatch action to update token in store
        api.dispatch({
          type: 'auth/setCredentials',
          payload: { 
            accessToken: newToken, 
            refreshToken,
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

