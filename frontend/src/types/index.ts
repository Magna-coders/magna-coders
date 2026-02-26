// Re-export types from services for backward compatibility
export type { Post, Comment, CreatePostData, CreateCommentData } from '../services/posts';
export type { Job, CreateJobData } from '../services/jobs';
export type { Message, Chat, SendMessageData } from '../services/messages';

// Additional types for UI components
export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  profilePicture?: string;
  verified?: boolean;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  experienceLevel?: string;
  createdAt?: string;
}

// Feed post types (union of all post types)
export type FeedPost = Post;
export type JobPost = Job;
export type ProjectPost = Post & {
  projectName: string;
  projectDescription: string;
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
};
export type TechNewsPost = Post & {
  newsTitle: string;
  newsUrl: string;
  newsSource?: string;
};
export type RegularPost = Post;

// Conversation type for messages
export type Conversation = Chat;
