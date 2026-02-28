import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

interface RequestConfig extends AxiosRequestConfig {
  requiresAuth?: boolean;
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors like 401 Unauthorized
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        // Optional: Redirect to login or clear token
        // localStorage.removeItem('accessToken');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiFetch = async <T>(url: string, config: RequestConfig = {}): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance(url, config);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'API request failed');
  }
};

export default axiosInstance;
