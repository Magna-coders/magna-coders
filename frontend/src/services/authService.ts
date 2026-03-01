'use client';

import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Centralized Authentication Service
 * Handles token storage, refresh, validation, and API interceptors
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

interface ValidateResponse {
  success: boolean;
  data: {
    isValid: boolean;
    isExpired: boolean;
    expiresAt: string;
    userId: string;
    email: string;
    username: string;
    tokenType: 'access' | 'refresh';
  };
}

class AuthService {
  private apiClient: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: ((token: string) => void)[] = [];

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: add auth token to all requests
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401 with automatic refresh
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If 401 and not a refresh attempt already, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Token is already being refreshed, queue this request
            return new Promise((resolve) => {
              this.refreshQueue.push((newToken: string) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(this.apiClient(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newTokens = await this.refreshAccessToken();
            this.storeTokens(newTokens);

            // Process all queued requests
            this.refreshQueue.forEach((callback) => callback(newTokens.accessToken));
            this.refreshQueue = [];

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.apiClient(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken') || null;
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken') || null;
  }

  /**
   * Store tokens in localStorage
   */
  storeTokens(tokens: TokenData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    if (tokens.expiresIn) {
      localStorage.setItem('tokenExpiresIn', String(tokens.expiresIn));
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<TokenData> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<RefreshResponse>(
        `${API_BASE}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to refresh token');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Validate current access token
   */
  async validateToken(): Promise<ValidateResponse['data']> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await axios.get<ValidateResponse>(
        `${API_BASE}/auth/validate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.success) {
        throw new Error('Token validation failed');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Token validation failed:', error);
      throw error;
    }
  }

  /**
   * Check if token is expired (without API call, based on expiry metadata)
   */
  isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;

    const expiresIn = localStorage.getItem('tokenExpiresIn');
    if (!expiresIn) return true;

    const expirationTime = parseInt(expiresIn, 10);
    const now = Math.floor(Date.now() / 1000);

    return now >= expirationTime;
  }

  /**
   * Get user ID from localStorage
   */
  getUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userId') || localStorage.getItem('userid') || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Logout user: clear tokens and redirect to login
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresIn');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userid');
    
    // Redirect to login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Get axios instance for making authenticated API calls
   */
  getAxiosInstance(): AxiosInstance {
    return this.apiClient;
  }

  /**
   * Make an authenticated API request
   */
  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await this.apiClient({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'API request failed');
    }
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  /**
   * Fetch wrapper that automatically includes authorization header
   * Use this for direct fetch calls instead of manually adding Authorization header
   */
  async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401, try to refresh token and retry
    const headersObj = options.headers && typeof options.headers === 'object' ? options.headers as Record<string, string> : {};
    if (response.status === 401 && !headersObj['X-No-Retry']) {
      try {
        const newTokens = await this.refreshAccessToken();
        this.storeTokens(newTokens);

        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newTokens.accessToken}`,
        };

        return fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      } catch (error) {
        this.logout();
        throw error;
      }
    }

    return response;
  }
}

// Singleton instance
const authService = new AuthService();

export default authService;
export type { TokenData, RefreshResponse, ValidateResponse };
