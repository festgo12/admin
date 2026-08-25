'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthResponse } from '@/types/auth';
import { authService } from '@/services/auth-service';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkPersistedAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (token) {
          const user = await authService.getProfile();
          setUser(user);
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } finally {
        setIsLoading(false);
      }
    };

    checkPersistedAuth();
  }, []);

  const login = (data: AuthResponse) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    router.push('/admin');
  };

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Best-effort server revocation — clear locally regardless
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
