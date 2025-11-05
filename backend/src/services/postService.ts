import { Post, Comment, Social } from '../api';
import { cloudinary } from '../utils/config';
import { PostType } from '../types/posts';
import { db } from '../utils/prismaClient';

type SocialNotificationType = 'FOLLOW' | 'LIKE' | 'COMMENT' | 'REPLY' | 'PROJECT_INVITE' | 'PROJECT_UPDATE' | 'MESSAGE' | 'SYSTEM';

class PostService {
  private postModel: Post;
  private commentModel: Comment;
  private socialModel: Social;

  constructor() {
    this.postModel = new Post();
    this.commentModel = new Comment();
    this.socialModel = new Social();
  }

  // Create new post
  async createPost(postData: {
    title: string;
    content?: string;
    postType: PostType;
    tags?: string[];
    categoryId?: string;
    authorId: string;
    imageLink?: string;
    imageId?: string;
  }) {
    // Validate post data
    if (!postData.title?.trim()) {
      throw new Error('Title is required');
    }

    if (!postData.content && !postData.imageLink) {
      throw new Error('Content or image is required');
    }

    // Create post
    const post = await this.postModel.create({
      title: postData.title.trim(),
      content: postData.content?.trim(),
      post_type: postData.postType,
      tags: postData.tags || [],
      author_id: postData.authorId,
      category_ids: postData.categoryId ? [postData.categoryId] : undefined,
      media_ids: postData.imageId ? [postData.imageId] : undefined
    });

    // Award tokens for posting
    // This would be handled by the user service

    return post;
  }

  // Get posts with filtering and pagination
  async getPosts(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    categoryId?: string;
    authorId?: string;
  } = {}) {
    return await this.postModel.findMany(options);
  }

  // Get single post with details
  async getPostById(id: string, userId?: string) {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    // Increment view count
    await this.postModel.incrementViews(id);

    return post;
  }

  // Update post
  async updatePost(id: string, updates: {
    content?: string;
    tags?: string[];
    categoryId?: string;
  }, authorId: string) {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new Error('Access denied');
    }

    return await this.postModel.update(id, updates);
  }

  // Delete post
  async deletePost(id: string, authorId: string) {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new Error('Access denied');
    }

    // Delete associated comments and replies
    const comments = await this.commentModel.findByPostId(post.id);
    for (const comment of comments) {
      await this.commentModel.delete(comment.id, authorId);
    }

    await this.postModel.delete(id);
    return { message: 'Post deleted successfully' };
  }

  // Like/unlike post
  async toggleLike(postId: string, userId: string) {
    return await this.socialModel.toggleLike(userId, 'post', postId);
  }

  // Search posts
  async searchPosts(query: string, options: {
    page?: number;
    limit?: number;
    categoryId?: string;
  } = {}) {
    return await this.postModel.search(query, options);
  }

  // Verify post (admin only)
  async verifyPost(id: string, verifiedBy: string) {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    // Update post status
    await db.posts.update({
      where: { id },
      data: {
        is_verified: true,
        verified_by: verifiedBy,
        verified_at: new Date(),
      }
    });

    // Create notification for post author
    await this.socialModel.createNotification({
      user_id: post.author_id,
      type: 'MESSAGE' as const, 
      title: 'Post Verified',
      message: 'Your post has been verified and is now visible to all users',
      post_id: id,
    });

    return { message: 'Post verified successfully' };
  }

  // Upload image to cloudinary
  async uploadImage(imageBuffer: Buffer, preset: string = 'default') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: preset,
          resource_type: 'image',
        },
        (error: any, result: any) => {
          if (error) {
            reject(new Error(`Image upload failed: ${error.message}`));
          } else if (result) {
            resolve({
              imageLink: result.secure_url,
              imageId: result.public_id,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );

      uploadStream.end(imageBuffer);
    });
  }

  // Delete image from cloudinary
  async deleteImage(imageId: string) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(imageId, (error: any, result: any) => {
        if (error) {
          reject(new Error(`Image deletion failed: ${error.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  // Get trending posts
  async getTrendingPosts(limit: number = 10) {
    return await this.postModel.findMany({
      limit,
      sortBy: 'trending',
    });
  }

  // Get posts by category
  async getPostsByCategory(categoryId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    return await this.postModel.findMany({
      ...options,
      categoryId,
    });
  }

  // Get user's posts
  async getUserPosts(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    return await this.postModel.findMany({
      ...options,
      authorId: userId,
    });
  }
}

export default PostService;