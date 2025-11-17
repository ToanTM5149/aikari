/**
 * Shared Types
 * 
 * File này chứa tất cả types dùng chung giữa các features
 * Đặt ở đây để tránh circular imports
 */

/**
 * User Interface
 * 
 * Đại diện cho user trong hệ thống
 */
export interface User {
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  phone_numbers?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  preferences?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
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

