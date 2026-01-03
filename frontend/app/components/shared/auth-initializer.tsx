/**
 * Auth Initializer Component
 * 
 * Component này chạy khi app khởi động để restore authentication state
 * từ refresh token cookie (HTTP-only cookie).
 * 
 * Flow:
 * 1. Check localStorage có user info không
 * 2. Nếu có user nhưng không có access token → gọi refresh token API
 * 3. Nếu refresh thành công → restore auth state
 * 4. Nếu refresh fail → clear state và để user login lại
 */

import { useEffect, useState } from 'react';
import { useAppSelector } from '~/redux/store';
import { selectIsAuthenticated, selectCurrentUser } from '~/redux/features/auth/slice';
import { useRefreshTokenMutation } from '~/redux/features/auth/api';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const [refreshToken, { isLoading }] = useRefreshTokenMutation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Nếu đã authenticated → không cần làm gì
      if (isAuthenticated && currentUser) {
        setIsInitialized(true);
        return;
      }

      // Check localStorage có user info không
      const savedUserStr = localStorage.getItem('user');
      if (!savedUserStr) {
        // Không có user info → chắc chắn chưa login
        setIsInitialized(true);
        return;
      }

      try {
        const savedUser = JSON.parse(savedUserStr);
        
        // Có user info nhưng không có access token → gọi refresh token
        // Refresh token sẽ được gửi tự động qua HTTP-only cookie
        // onQueryStarted trong refreshToken mutation sẽ tự động update token và restore user
        await refreshToken().unwrap();
      } catch (error) {
        // Refresh token fail → clear localStorage và để user login lại
        console.log('Refresh token failed, user needs to login again');
        localStorage.removeItem('user');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []); // Chỉ chạy một lần khi mount

  // Hiển thị loading khi đang initialize
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

