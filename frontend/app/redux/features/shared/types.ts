/**
 * Shared Types
 * 
 * File này chứa tất cả types dùng chung giữa các features
 * Đặt ở đây để tránh circular imports
 */

/**
 * User Entity Type
 * 
 * Mô tả cấu trúc của một user object
 * Phải match với backend API response
 */
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
}

/**
 * API Error Response Type
 * 
 * Cấu trúc error response từ backend
 */
export interface ApiError {
  detail: string;
  status?: number;
  data?: {
    message: string;
    errors?: Record<string, string[]>;
  };
}

/**
 * Token Response Type
 * 
 * Response từ login/register endpoint
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

/**
 * API Request State Type
 * 
 * Generic type cho tracking API request status
 * Dùng cho RTK Query hoặc custom async thunks
 */
export interface ApiRequestState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: 'idle' | 'pending' | 'succeeded' | 'failed';
}

