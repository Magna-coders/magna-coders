import { apiFetch } from './apiClient';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website_url?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  whatsapp_url?: string;
  availability?: string;
  profile_complete_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
}

export interface GetUsersResponse {
  success: boolean;
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
  };
}

/**
 * Fetch all users (builders) from the backend
 */
export const getUsers = async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.location) searchParams.set('location', params.location);

  const query = searchParams.toString();
  const data = await apiFetch<GetUsersResponse>(`/users${query ? `?${query}` : ''}`, { method: 'GET' });

  return data;
};

/**
 * Fetch a single user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const data = await apiFetch<{ success: boolean; user: User }>(`/users/${id}`, { method: 'GET' });
    return data.user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};
