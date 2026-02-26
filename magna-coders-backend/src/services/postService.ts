import { cloudinary } from '../utils/config';

class PostService {
  private postModel: any;
  private commentModel: any;
  private socialModel: any;

  constructor() {
    this.postModel = null;
    this.commentModel = null;
    this.socialModel = null;
  }

  // Create new post
  async createPost(postData: {
    title: string;
    content?: string;
    postType: 'TEXT' | 'IMAGE' | 'LINK' | 'PROJECT';
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
      postType: postData.postType,
      tags: postData.tags || [],
      authorId: postData.authorId,
      categoryId: postData.categoryId,
      imageLink: postData.imageLink,
      imageId: postData.imageId,
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

    if (post.author_id !== authorId) {
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

    if (post.author_id !== authorId) {
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
    await this.postModel.verifyPost(id, verifiedBy);

    // Create notification for post author
    const post = await this.postModel.findById(id);
    if (post) {
      await this.socialModel.createNotification({
        userId: post.author_id,
        type: 'SYSTEM',
        title: 'Post Verified',
        message: 'Your post has been verified and is now visible to all users',
        postId: id,
      });
    }

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