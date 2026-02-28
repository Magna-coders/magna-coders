import { apiFetch } from './apiClient';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  participants: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageData {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface CreateDirectChatData {
  recipientId: string;
}

export interface CreateGroupChatData {
  name: string;
  participantIds: string[];
}

/**
 * Get all chats for the current user
 */
export const getUserChats = async (): Promise<Chat[]> => {
  const data = await apiFetch<any>('/chat', { method: 'GET' });
  
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.chats && Array.isArray(data.chats)) {
    return data.chats;
  }
  return [];
};

/**
 * Create a direct chat with another user
 */
export const createDirectChat = async (recipientId: string): Promise<Chat> => {
  const data = await apiFetch<any>('/chat/direct', {
    method: 'POST',
    data: { recipientId },
  });
  return data?.chat || data;
};

/**
 * Create a group chat
 */
export const createGroupChat = async (chatData: CreateGroupChatData): Promise<Chat> => {
  const data = await apiFetch<any>('/chat/group', {
    method: 'POST',
    data: chatData,
  });
  return data?.chat || data;
};

/**
 * Get messages for a specific chat
 */
export const getChatMessages = async (chatId: string, limit = 50, offset = 0): Promise<Message[]> => {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(limit));
  searchParams.set('offset', String(offset));

  const query = searchParams.toString();
  const data = await apiFetch<any>(`/chat/${chatId}/messages?${query}`, { method: 'GET' });
  
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.messages && Array.isArray(data.messages)) {
    return data.messages;
  }
  return [];
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (chatId: string, messageData: SendMessageData): Promise<Message> => {
  const data = await apiFetch<any>(`/chat/${chatId}/messages`, {
    method: 'POST',
    data: messageData,
  });
  return data?.message || data;
};

/**
 * Upload a file for messaging
 */
export const uploadMessageFile = async (file: File): Promise<{
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const response = await fetch(`${API_BASE}/chat/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const data = await response.json();
  return data;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (chatId: string): Promise<void> => {
  await apiFetch(`/chat/${chatId}/read`, { method: 'POST' });
};
