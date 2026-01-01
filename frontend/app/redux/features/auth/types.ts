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
 * Register Credentials
 * 
 * Data cần thiết để đăng ký tài khoản
 * Step 1: username, email, password, role (required)
 * Step 2: full_name, phone_numbers, address, city, country (optional)
 */
export interface RegisterCredentials {
  // Step 1 - Required
  username: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
  
  // Step 2 - Optional
  full_name?: string;
  phone_numbers?: string;
  address?: string;
  city?: string;
  country?: string;
}

/**
 * Set Credentials Payload
 * 
 * ⚠️ SECURITY: refreshToken không còn được gửi từ server
 * Refresh token chỉ tồn tại trong HTTP-only cookie
 */
export interface SetCredentialsPayload {
  accessToken: string;
  refreshToken?: string; // Optional - deprecated, sẽ xóa trong version sau
  user: User;
}

/**
 * User Update Me Type
 * 
 * Data để update thông tin cá nhân
 * User chỉ có thể update các field này, không thể thay đổi username hoặc role
 */
export interface UserUpdateMe {
  full_name?: string;
  email?: string;
  phone_numbers?: string;
  address?: string;
  city?: string;
  country?: string;
  preferences?: Record<string, any>;
}

/**
 * Update Password Type
 * 
 * Data để đổi mật khẩu
 */
export interface UpdatePassword {
  current_password: string;
  new_password: string;
}

