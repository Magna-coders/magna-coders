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

// Post interfaces for frontend components
export interface Author {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface BasePost {
  id: string;
  type: 'regular' | 'job' | 'project' | 'tech-news';
  author: Author;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  content: string;
  image?: string;
  imageUrl?: string;
  title?: string;
  tags?: string[];
}

export interface RegularPost extends BasePost {
  type: 'regular';
}

export interface JobPost extends BasePost {
  type: 'job';
  company?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  description?: string;
  timeLeft?: string;
  deadlineProgress?: number;
}

export interface ProjectPost extends BasePost {
  type: 'project';
  description?: string;
  techStack?: string[];
  requestsSent?: number;
  membersNeeded?: number;
}

export interface TechNewsPost extends BasePost {
  type: 'tech-news';
  title: string;
  summary?: string;
  source?: string;
  url?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  timestamp: number;
  isLiked: boolean;
  likes: number;
  isOwner: boolean;
  replies?: Comment[];
}

export type FeedPost = RegularPost | JobPost | ProjectPost | TechNewsPost;
