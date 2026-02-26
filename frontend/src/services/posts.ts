import { apiFetch } from './apiClient';

// Types matching the backend response structure
export interface Post {
  id: string;
  userId: string;
  content: string;
  type: 'REGULAR' | 'JOB' | 'PROJECT' | 'TECH_NEWS';
  category?: string;
  tags?: string[];
  mediaUrls?: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
    verified?: boolean;
  };
  // Job-specific fields
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  // Project-specific fields
  projectName?: string;
  projectDescription?: string;
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  // Tech news-specific fields
  newsTitle?: string;
  newsUrl?: string;
  newsSource?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likes: number;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
}

export interface CreatePostData {
  content: string;
  type: 'REGULAR' | 'JOB' | 'PROJECT' | 'TECH_NEWS';
  category?: string;
  tags?: string[];
  mediaUrls?: string[];
  // Job-specific
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  // Project-specific
  projectName?: string;
  projectDescription?: string;
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  // Tech news-specific
  newsTitle?: string;
  newsUrl?: string;
  newsSource?: string;
}

export interface CreateCommentData {
  content: string;
}

export interface GetPostsParams {
  limit?: number;
  offset?: number;
  type?: string;
  category?: string;
  search?: string;
}

/**
 * Fetch posts from the backend
 */
export const getPosts = async (params: GetPostsParams = {}): Promise<Post[]> => {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  if (params.type) searchParams.set('type', params.type);
  if (params.category) searchParams.set('category', params.category);
  if (params.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  const data = await apiFetch<any>(`/api/posts${query ? `?${query}` : ''}`, { method: 'GET' });

  // Handle different response formats
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.posts && Array.isArray(data.posts)) {
    return data.posts;
  }
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
};

/**
 * Fetch a single post by ID
 */
export const getPostById = async (id: string): Promise<Post | null> => {
  try {
    const data = await apiFetch<any>(`/api/posts/${id}`, { method: 'GET' });
    
    // Handle different response formats
    const rawPost = data?.post || data?.data || data;
    
    if (!rawPost || !rawPost.id) {
      return null;
    }
    
    // Map backend data to frontend format (same as feed page)
    const post = {
      id: rawPost.id,
      userId: rawPost.author_id || rawPost.userId,
      content: rawPost.content,
      type: (rawPost.post_type?.toUpperCase() || 'REGULAR') as 'REGULAR' | 'JOB' | 'PROJECT' | 'TECH_NEWS',
      category: rawPost.category,
      tags: rawPost.tags || [],
      mediaUrls: rawPost.mediaUrls || [],
      likes: rawPost.likesCount || rawPost._count?.likes || 0,
      comments: rawPost.commentsCount || rawPost._count?.comments || 0,
      shares: 0,
      createdAt: rawPost.created_at || rawPost.createdAt,
      updatedAt: rawPost.updated_at || rawPost.updatedAt,
      user: rawPost.author || rawPost.users || rawPost.user ? {
        id: rawPost.author?.id || rawPost.users?.id || rawPost.user?.id,
        username: rawPost.author?.username || rawPost.users?.username || rawPost.user?.username || 'Unknown',
        fullName: rawPost.author?.username || rawPost.users?.username || rawPost.user?.username || 'Unknown',
        profilePicture: rawPost.author?.avatar_url || rawPost.users?.avatar_url || rawPost.user?.avatar_url,
        verified: rawPost.author?.verified || rawPost.users?.verified || rawPost.user?.verified || false
      } : undefined,
      // Job-specific fields
      title: rawPost.title,
      company: rawPost.company,
      location: rawPost.location,
      salary: rawPost.salary,
      jobType: rawPost.jobType,
      // Project-specific fields
      projectName: rawPost.projectName,
      projectDescription: rawPost.projectDescription,
      techStack: rawPost.techStack,
      githubUrl: rawPost.githubUrl,
      liveUrl: rawPost.liveUrl,
      // Tech news-specific fields
      newsTitle: rawPost.newsTitle,
      newsUrl: rawPost.newsUrl,
      newsSource: rawPost.newsSource
    };
    
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
};

/**
 * Create a new post
 */
export const createPost = async (postData: CreatePostData): Promise<Post> => {
  const data = await apiFetch<any>('/api/posts', {
    method: 'POST',
    data: postData,
  });
  return data?.post || data;
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
  await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
};

/**
 * Like a post
 */
export const likePost = async (postId: string): Promise<void> => {
  await apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string): Promise<void> => {
  await apiFetch(`/api/posts/${postId}/unlike`, { method: 'POST' });
};

/**
 * Get comments for a post
 */
export const getComments = async (postId: string): Promise<Comment[]> => {
  const data = await apiFetch<any>(`/api/posts/${postId}/comments`, { method: 'GET' });
  
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.comments && Array.isArray(data.comments)) {
    return data.comments;
  }
  return [];
};

/**
 * Create a comment on a post
 */
export const createComment = async (postId: string, commentData: CreateCommentData): Promise<Comment> => {
  const data = await apiFetch<any>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    data: commentData,
  });
  return data?.comment || data;
};

/**
 * Get user feed (posts from followed users)
 */
export const getUserFeed = async (params: GetPostsParams = {}): Promise<Post[]> => {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  const data = await apiFetch<any>(`/social/feed${query ? `?${query}` : ''}`, { method: 'GET' });

  if (Array.isArray(data)) {
    return data;
  }
  if (data?.posts && Array.isArray(data.posts)) {
    return data.posts;
  }
  return [];
};
