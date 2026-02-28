import { apiFetch } from './apiClient';

export interface FriendRequest {
  id: string;
  sender: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    bio?: string;
  };
  status: string;
  createdAt: string;
}

export interface Friend {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
}

export interface FriendshipStatus {
  success: boolean;
  status: 'friends' | 'request_sent' | 'request_received' | 'none';
  requestId?: string;
}

/**
 * Send a friend request
 */
export const sendFriendRequest = async (receiverId: string): Promise<void> => {
  await apiFetch('/friends/request', {
    method: 'POST',
    data: { receiverId }
  });
};

/**
 * Get pending friend requests
 */
export const getPendingRequests = async (): Promise<FriendRequest[]> => {
  const data = await apiFetch<{ success: boolean; requests: FriendRequest[] }>('/friends/requests/pending', {
    method: 'GET'
  });
  return data.requests;
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  await apiFetch(`/friends/request/${requestId}/accept`, {
    method: 'POST'
  });
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  await apiFetch(`/friends/request/${requestId}/reject`, {
    method: 'POST'
  });
};

/**
 * Get friends list
 */
export const getFriends = async (userId?: string): Promise<Friend[]> => {
  const endpoint = userId ? `/friends/${userId}` : '/friends';
  const data = await apiFetch<{ success: boolean; friends: Friend[] }>(endpoint, {
    method: 'GET'
  });
  return data.friends;
};

/**
 * Check friendship status with another user
 */
export const checkFriendshipStatus = async (targetUserId: string): Promise<FriendshipStatus> => {
  const data = await apiFetch<FriendshipStatus>(`/friends/status/${targetUserId}`, {
    method: 'GET'
  });
  return data;
};

/**
 * Unfriend a user
 */
export const unfriend = async (friendId: string): Promise<void> => {
  await apiFetch(`/friends/${friendId}`, {
    method: 'DELETE'
  });
};
