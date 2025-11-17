/**
 * User Feature Types
 * 
 * Types riêng cho user feature
 */

import type { User } from '../shared/types';

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

