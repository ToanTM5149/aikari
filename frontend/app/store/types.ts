/**
 * Redux State Types
 * 
 * File này định nghĩa tất cả types cho Redux state
 * Giúp maintain consistency và type safety trong toàn bộ app
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
 * User State Type
 * 
 * Quản lý thông tin user và preferences
 * - currentUser: User đang đăng nhập
 * - profile: Profile detail của user
 * - preferences: User preferences (theme, language, etc.)
 * - loading: Đang load user data
 * - error: Lỗi nếu có
 */
export interface UserState {
  currentUser: User | null;
  profile: UserProfile | null;
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
}

/**
 * User Profile Type
 * 
 * Thông tin chi tiết của user profile
 */
export interface UserProfile {
  id: string;
  bio?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  avatar_url?: string;
}

/**
 * User Preferences Type
 * 
 * Lưu trữ preferences của user
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'vi' | 'ja';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
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
