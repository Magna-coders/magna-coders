import apiClient from './apiClient';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  profilePicture: string | null;
  bio: string | null;
  createdAt: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users');
  return response.data;
};
