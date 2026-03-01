import authService from './authService';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

interface RequestConfig extends AxiosRequestConfig {
  requiresAuth?: boolean;
}

// Use auth service's axios instance which has interceptors for token refresh
const axiosInstance = authService.getAxiosInstance();

/**
 * Backward-compatible apiFetch function
 * Now uses the auth service's axios instance with automatic token refresh
 */
export const apiFetch = async <T>(url: string, config: RequestConfig = {}): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance(url, config);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'API request failed');
  }
};

export { authService };
export default axiosInstance;
