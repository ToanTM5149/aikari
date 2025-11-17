/**
 * Auth Feature Types
 * 
 * Types riêng cho auth feature
 */

import type { User, TokenResponse } from '../shared/types';

/**
 * Auth State Type
 * 
 * Quản lý trạng thái authentication
 * - isAuthenticated: User đã đăng nhập chưa
 * - accessToken: JWT token để gọi API
 * - refreshToken: Token để refresh access token
 * - user: Thông tin user hiện tại
 * - loading: Đang thực hiện auth action (login, logout, etc.)
 * - error: Lỗi nếu có
 */
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Login Credentials Type
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register Credentials Type
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
}

/**
 * Set Credentials Payload
 */
export interface SetCredentialsPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

