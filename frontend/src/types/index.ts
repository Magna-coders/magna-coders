export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  avatar: string;
  isMe: boolean;
  type: 'text' | 'image' | 'file' | 'voice';
  read: boolean;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  isTyping: boolean;
  pinned: boolean;
  isGroup: boolean;
  archived: boolean;
  avatarColor: string;
  messages: Message[];
}
