'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { magnaAIService } from '@/services/magnaAiService';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setTokenState] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    // Check for accessToken first (used by login), then fall back to authToken
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    if (storedToken) {
      setTokenState(storedToken);
      magnaAIService.setAuthToken(storedToken);
    }
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      // Store in both locations for compatibility
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('authToken', newToken);
      magnaAIService.setAuthToken(newToken);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authToken');
      magnaAIService.clearAuthToken();
    }
  };

  const clearToken = () => {
    setTokenState(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    magnaAIService.clearAuthToken();
  };

  const value: AuthContextType = {
    token,
    setToken,
    clearToken,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
