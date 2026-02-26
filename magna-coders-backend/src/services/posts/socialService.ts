import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// TypeScript interfaces
interface LikeToggleData {
  userId: string;
  targetType: 'post' | 'comment';
  targetId: string;
}

interface NotificationData {
  userId: string;
  type: 'SYSTEM' | 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION';
  title: string;
  message: string;
  postId?: string;
  commentId?: string;
  senderId?: string;
}

interface SocialServiceResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface SocialError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Logger utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[SOCIAL SERVICE INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[SOCIAL SERVICE ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[SOCIAL SERVICE WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

class SocialService {
  // Toggle like on post or comment
  async toggleLike(data: LikeToggleData): Promise<SocialServiceResponse> {
    try {
      const { userId, targetType, targetId } = data;

      logger.info('Toggling like', { userId, targetType, targetId });

      // Check if like already exists
      const existingLike = await prisma.likes.findFirst({
        where: {
          user_id: userId,
          ...(targetType === 'post' && { post_id: targetId }),
          ...(targetType === 'comment' && { comment_id: targetId })
        }
      });

      if (existingLike) {
        // Unlike: Remove the like
        await prisma.likes.delete({
          where: { id: existingLike.id }
        });

        logger.info('Like removed', { userId, targetType, targetId });
        return {
          success: true,
          message: 'Like removed successfully',
          data: { liked: false }
        };
      } else {
        // Like: Add the like
        const likeData: any = {
          id: uuidv4(),
          user_id: userId
        };

        if (targetType === 'post') {
          likeData.post_id = targetId;
        }
        if (targetType === 'comment') {
          likeData.comment_id = targetId;
        }

        await prisma.likes.create({
          data: likeData
        });

        // Create notification for the post/comment author
        if (targetType === 'post') {
          const post = await prisma.posts.findUnique({
            where: { id: targetId },
            select: { author_id: true, title: true }
          });

          if (post && post.author_id !== userId) {
            await this.createNotification({
              userId: post.author_id,
              type: 'LIKE',
              title: 'Post Liked',
              message: `Someone liked your post "${post.title}"`,
              postId: targetId,
              senderId: userId
            });
          }
        } else if (targetType === 'comment') {
          const comment = await prisma.comments.findUnique({
            where: { id: targetId },
            select: { author_id: true, content: true }
          });
          if (comment && comment.author_id !== userId) {
            await this.createNotification({
              userId: comment.author_id,
              type: 'LIKE',
              title: 'Comment Liked',
              message: `Someone liked your comment`,
              commentId: targetId,
              senderId: userId
            });
          }
        }

        logger.info('Like added', { userId, targetType, targetId });
        return {
          success: true,
          message: 'Like added successfully',
          data: { liked: true }
        };
      }

    } catch (error: any) {
      logger.error('Database error in toggleLike', error);
      const dbError: SocialError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to toggle like',
        statusCode: 500,
        details: error.message
      };
      throw dbError;
    }
  }

  // Create notification
  async createNotification(data: NotificationData): Promise<any> {
    try {
      logger.info('Creating notification', {
        userId: data.userId,
        type: data.type,
        title: data.title
      });

      // TODO: Uncomment when notifications table schema is updated
      // const notification = await prisma.notifications.create({
      //   data: {
      //     user_id: data.userId,
      //     title: data.title,
      //     message: data.message,
      //   }
      // });

      logger.info('Notification creation skipped (schema needs update)');
      return { message: 'Notification would be created here' };

    } catch (error: any) {
      logger.error('Database error in createNotification', error);
      const dbError: SocialError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to create notification',
        statusCode: 500,
        details: error.message
      };
      throw dbError;
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<any> {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false
      } = options;

      const skip = (page - 1) * limit;

      logger.info('Fetching user notifications', { userId, page, limit, unreadOnly });

      const notifications = await prisma.notifications.findMany({
        where: {
          user_id: userId,
          ...(unreadOnly && { is_read: false })
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      });

      const total = await prisma.notifications.count({
        where: {
          user_id: userId,
          ...(unreadOnly && { is_read: false })
        }
      });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error: any) {
      logger.error('Database error in getUserNotifications', error);
      const dbError: SocialError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch notifications',
        statusCode: 500,
        details: error.message
      };
      throw dbError;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string, userId: string): Promise<SocialServiceResponse> {
    try {
      logger.info('Marking notification as read', { notificationId, userId });

      const notification = await prisma.notifications.findFirst({
        where: {
          id: notificationId,
          user_id: userId
        }
      });

      if (!notification) {
        const error: SocialError = {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          statusCode: 404
        };
        logger.warn('Notification not found', { notificationId, userId });
        throw error;
      }

      await prisma.notifications.update({
        where: { id: notificationId },
        data: { is_read: true }
      });

      logger.info('Notification marked as read', { notificationId });
      return {
        success: true,
        message: 'Notification marked as read'
      };

    } catch (error: any) {
      // Re-throw custom errors
      if (error.code && error.statusCode) {
        throw error;
      }

      logger.error('Database error in markNotificationAsRead', error);
      const dbError: SocialError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to mark notification as read',
        statusCode: 500,
        details: error.message
      };
      throw dbError;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string): Promise<SocialServiceResponse> {
    try {
      logger.info('Marking all notifications as read', { userId });

      const result = await prisma.notifications.updateMany({
        where: {
          user_id: userId,
          is_read: false
        },
        data: { is_read: true }
      });

      logger.info('All notifications marked as read', {
        userId,
        updatedCount: result.count
      });

      return {
        success: true,
        message: `${result.count} notifications marked as read`
      };

    } catch (error: any) {
      logger.error('Database error in markAllNotificationsAsRead', error);
      const dbError: SocialError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to mark all notifications as read',
        statusCode: 500,
        details: error.message
      };
      throw dbError;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<SocialServiceResponse> {
    try {
      logger.info('Deleting notification', { notificationId, userId });

      const notification = await prisma.notifications.findFirst({
        where: {
          id: notificationId,
          user_id: userId
        }
      });

      if (!notification) {
        const error: SocialError = {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          statusCode: 404
        };
        logger.warn('Notification not found for deletion', { notificationId, userId });
        throw error;
      }

      await prisma.notifications.delete({
        where: { id: notificationId }
      });

      logger.info('Notification deleted successfully', { notificationId });
      return {
        success: true,
        message: 'Notification deleted successfully'
      };

    } catch (error: any) {
      // Re-throw custom errors
      if (error.code && error.statusCode) {
        throw error;
      }

      logger.error('Database error in deleteNotification', error);
      const dbError: SocialError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete notification',
        statusCode: 500,
        details: error.message
      };
      throw dbError;
    }
  }

  // Get like count for a post or comment
  async getLikeCount(targetType: 'post' | 'comment', targetId: string): Promise<number> {
    try {
      if (targetType === 'post') {
        const count = await prisma.likes.count({
          where: { post_id: targetId }
        });
        return count;
      } else {
        // For comments, we'd need a comment_likes table or similar
        // For now, return 0
        return 0;
      }

    } catch (error: any) {
      logger.error('Database error in getLikeCount', error);
      return 0;
    }
  }

  // Check if user has liked a post or comment
  async hasUserLiked(userId: string, targetType: 'post' | 'comment', targetId: string): Promise<boolean> {
    try {
      const like = await prisma.likes.findFirst({
        where: {
          user_id: userId,
          ...(targetType === 'post' && { post_id: targetId }),
          // ...(targetType === 'comment' && { comment_id: targetId })
        }
      });

      return !!like;

    } catch (error: any) {
      logger.error('Database error in hasUserLiked', error);
      return false;
    }
  }
}

export default SocialService;