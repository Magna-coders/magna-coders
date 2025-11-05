import { PrismaClient } from '@prisma/client';
import { prisma, db } from '../utils/prismaClient';

// Type definitions matching the schema
type NotificationType = 'FOLLOW' | 'LIKE' | 'COMMENT' | 'REPLY' | 'PROJECT_INVITE' | 'PROJECT_UPDATE' | 'MESSAGE';

export class Social {
  private prisma: any;

  constructor() {
    this.prisma = prisma;
  }

  // Follow/unfollow user
  async toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const existingFollow = await db.follows.findFirst({
      where: {
        follower_id: followerId,
        following_id: followingId
      }
    });

    if (existingFollow) {
      // Unfollow
      await db.follows.delete({ where: { id: existingFollow.id } });
      return { following: false };
    } else {
      // Follow
      await db.follows.create({
        data: {
          follower_id: followerId,
          following_id: followingId,
        }
      });

      // Create notification
      await this.createNotification({
        user_id: followingId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: 'A new user started following you',
      });

      return { following: true };
    }
  }

  // Get followers
  async getFollowers(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;

    const followers = await db.follows.findMany({
      where: { following_id: userId },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            bio: true,
            profile_complete_percentage: true,
            _count: {
              select: {
                followers: {
                  where: { following_id: userId }
                },
                following: {
                  where: { follower_id: userId }
                }
              }
            }
          }
        }
      }
    });

    return followers.map((follow: any) => ({
      ...follow.follower,
      followersCount: follow.follower._count.followers,
      followingCount: follow.follower._count.following,
      _count: undefined,
    }));
  }

  // Get following
  async getFollowing(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;

    const following = await db.follows.findMany({
      where: { follower_id: userId },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            bio: true,
            profile_complete_percentage: true,
            _count: {
              select: {
                followers: {
                  where: { following_id: userId }
                },
                following: {
                  where: { follower_id: userId }
                }
              }
            }
          }
        }
      }
    });

    return following.map((follow: any) => ({
      ...follow.following,
      followersCount: follow.following._count.followers,
      followingCount: follow.following._count.following,
      _count: undefined,
    }));
  }

  // Get user feed
  async getUserFeed(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;

    // Get users that current user follows
    const following = await db.follows.findMany({
      where: { follower_id: userId },
      select: { following_id: true }
    });

    const followingIds = following.map((follow: any) => follow.following_id);

    // Include user's own posts and posts from followed users
    const posts = await db.posts.findMany({
      where: {
        OR: [
          { author_id: { in: [...followingIds, userId] } },
          { author_id: userId }
        ]
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            profile_complete_percentage: true
          }
        },
        categories: {
          include: {
            categories: true
          }
        },
        post_media: {
          include: {
            media: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          }
        }
      }
    });

    return posts.map((post: any) => ({
      ...post,
      commentsCount: post._count.comments,
      likesCount: post._count.likes,
      _count: undefined,
    }));
  }

  // Like/unlike content (post, comment, or reply)
  async toggleLike(userId: string, contentType: 'post' | 'comment' | 'reply', contentId: string): Promise<{ liked: boolean }> {
    const where: any = { user_id: userId };
    let updateData: any = {};

    switch (contentType) {
      case 'post':
        where.post_id = contentId;
        updateData = { posts: { connect: { id: contentId } } };
        break;
      case 'comment':
        where.comment_id = contentId;
        updateData = { comments: { connect: { id: contentId } } };
        break;
      case 'reply':
        where.reply_id = contentId;
        updateData = { comment_replies: { connect: { id: contentId } } };
        break;
    }

    const existingLike = await db.likes.findFirst({ where });

    if (existingLike) {
      // Unlike
      await db.likes.delete({ where: { id: existingLike.id } });

      // Decrement likes count
      switch (contentType) {
        case 'post':
          await db.posts.update({
            where: { id: contentId },
            data: { likes_count: { decrement: 1 } }
          });
          break;
        case 'comment':
          await db.comments.update({
            where: { id: contentId },
            data: { likes_count: { decrement: 1 } }
          });
          break;
        case 'reply':
          await db.comment_replies.update({
            where: { id: contentId },
            data: { likes_count: { decrement: 1 } }
          });
          break;
      }

      return { liked: false };
    } else {
      // Like
      await db.likes.create({
        data: {
          user_id: userId,
          ...updateData,
        }
      });

      // Increment likes count
      switch (contentType) {
        case 'post':
          await db.posts.update({
            where: { id: contentId },
            data: { likes_count: { increment: 1 } }
          });
          break;
        case 'comment':
          await db.comments.update({
            where: { id: contentId },
            data: { likes_count: { increment: 1 } }
          });
          break;
        case 'reply':
          await db.comment_replies.update({
            where: { id: contentId },
            data: { likes_count: { increment: 1 } }
          });
          break;
      }

      return { liked: true };
    }
  }

  // Create notification
  async createNotification(data: {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    post_id?: string;
    comment_id?: string;
    project_id?: string;
    message_id?: string;
  }) {
    return await db.notifications.create({
      data: {
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        post_id: data.post_id,
        comment_id: data.comment_id,
        project_id: data.project_id,
        message_id: data.message_id,
      }
    });
  }

  // Get user notifications
  async getUserNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const where: any = { user_id: userId };
    if (unreadOnly) {
      where.read_at = null;
    }

    const notifications = await db.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        users: true,
        posts: true,
        comments: true,
        projects: true,
        messages: true
      }
    });

    // Mark as read if getting all notifications
    if (!unreadOnly) {
      await db.notifications.updateMany({
        where: {
          user_id: userId,
          read_at: null
        },
        data: { read_at: new Date() }
      });
    }

    return notifications;
  }

  // Get unread notification count
  async getUnreadNotificationCount(userId: string): Promise<number> {
    return await db.notifications.count({
      where: {
        user_id: userId,
        read_at: null
      }
    });
  }

  // Search users
  async searchUsers(query: string, options: {
    page?: number;
    limit?: number;
    roleId?: string;
    skillId?: string;
    categoryId?: string;
  } = {}) {
    const { page = 1, limit = 20, roleId, skillId, categoryId } = options;

    const where: any = {
      OR: [
        {
          username: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          bio: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    };

    if (roleId) {
      where.roles = {
        some: { role_id: roleId }
      };
    }

    if (skillId) {
      where.skills = {
        some: { skill_id: skillId }
      };
    }

    if (categoryId) {
      where.categories = {
        some: { category_id: categoryId }
      };
    }

    const [users, totalCount] = await Promise.all([
      db.users.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        include: {
          roles: {
            include: {
              roles: true
            }
          },
          skills: {
            include: {
              skills: true
            }
          },
          categories: {
            include: {
              categories: true
            }
          },
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true
            }
          }
        }
      }),
      db.users.count({ where })
    ]);

    return {
      users: users.map((user: any) => ({
        ...user,
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        _count: undefined,
      })),
      totalCount,
      page,
      limit
    };
  }

  // Report content
  async reportContent(data: {
    reporter_id: string;
    reason: string;
    description?: string;
    content_type: 'USER' | 'POST' | 'COMMENT' | 'REPLY';
    content_id: string;
  }) {
    const reportData: any = {
      reporter_id: data.reporter_id,
      reason: data.reason,
      description: data.description,
      status: 'PENDING',
      created_at: new Date()
    };

    switch (data.content_type) {
      case 'USER':
        reportData.reported_user_id = data.content_id;
        break;
      case 'POST':
        reportData.reported_post_id = data.content_id;
        break;
      case 'COMMENT':
        reportData.reported_comment_id = data.content_id;
        break;
      case 'REPLY':
        reportData.reported_reply_id = data.content_id;
        break;
    }

    return await db.reports.create({
      data: reportData,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      }
    });
  }
}

export default Social;