import { apiFetch } from './apiClient';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  application_id?: string;
  opportunity_id?: string;
  project_id?: string;
  applications?: {
    id: string;
    status: string;
    users: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    opportunities: {
      id: string;
      title: string;
      author_id: string;
    };
  };
  opportunities?: {
    id: string;
    title: string;
    author_id: string;
  };
  projects?: {
    id: string;
    title: string;
    owner_id: string;
  };
}

export interface FriendRequestNotification {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar_url?: string;
    bio?: string;
  };
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  friendRequests: FriendRequestNotification[];
  unreadCount: number;
}

/**
 * Get all notifications
 */
export const getNotifications = async (): Promise<NotificationsResponse> => {
  const data = await apiFetch<NotificationsResponse>('/notifications', {
    method: 'GET'
  });
  return data;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  await apiFetch(`/notifications/${notificationId}/read`, {
    method: 'POST'
  });
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await apiFetch('/notifications/read-all', {
    method: 'POST'
  });
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiFetch(`/notifications/${notificationId}`, {
    method: 'DELETE'
  });
};
