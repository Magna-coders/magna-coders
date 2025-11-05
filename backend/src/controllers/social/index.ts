import { Request, Response } from 'express';
import { prisma, db } from '../../utils/prismaClient';

const followUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { targetUserId } = req.params;

  if (!targetUserId) {
    res.status(400).send({ message: 'Target user ID is required.' });
    return;
  }

  if (userId === targetUserId) {
    res.status(400).send({ message: 'Cannot follow yourself.' });
    return;
  }

  const [user, targetUser] = await Promise.all([
    db.users.findUnique({ where: { id: userId } } as any),
    db.users.findUnique({ where: { id: targetUserId } } as any)
  ]);

  if (!user || !targetUser) {
    res.status(404).send({ message: 'User not found.' });
    return;
  }

  const existingFollow = await db.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: targetUserId,
      }
    }
  });

  if (existingFollow) {
    res.status(400).send({ message: 'Already following this user.' });
    return;
  }

  await db.follows.create({
    data: {
      follower: { connect: { id: userId } },
      following: { connect: { id: targetUserId } },
    }
  });

  // Create notification
  await db.notifications.create({
    data: {
      type: 'FOLLOW',
      title: 'New Follower',
      message: `${user.username} started following you`,
      user: { connect: { id: targetUserId } },
    }
  });

  res.status(200).json({ message: 'User followed successfully.' });
};

const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user as string;
  const { targetUserId } = req.params;

  if (!targetUserId) {
    res.status(400).send({ message: 'Target user ID is required.' });
    return;
  }

  const follow = await db.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: targetUserId,
      }
    }
  });

  if (!follow) {
    res.status(400).send({ message: 'Not following this user.' });
    return;
  }

  await db.follows.delete({
    where: { id: follow.id }
  });

  res.status(200).json({ message: 'User unfollowed successfully.' });
};

const getFollowers = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const followers = await db.follows.findMany({
    where: { followingId: userId },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          isVerified: true,
          verificationBadge: true,
          _count: {
            select: {
              followers: true,
              following: true,
            }
          }
        }
      }
    }
  });

  const formattedFollowers = followers.map((f: any) => ({
    ...f.follower,
    followersCount: f.follower._count?.followers,
    followingCount: f.follower._count?.following,
    _count: undefined,
  }));

  res.status(200).json(formattedFollowers);
};

const getFollowing = async (req: Request, res: Response):Promise<void> => {
  const { userId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const following = await db.follows.findMany({
    where: { followerId: userId },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      following: {
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          isVerified: true,
          verificationBadge: true,
          _count: {
            select: {
              followers: true,
              following: true,
            }
          }
        }
      }
    }
  });

  const formattedFollowing = following.map((f: any) => ({
    ...f.following,
    followersCount: f.following._count?.followers,
    followingCount: f.following._count?.following,
    _count: undefined,
  }));

  res.status(200).json(formattedFollowing);
};

const getUserFeed = async (req: Request, res: Response):Promise<void> => {
  const userId = req.user as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  // Get users that current user follows
  const following = await db.follows.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  } as any);

  const followingIds = following.map((f: any) => f.followingId);

  // Include user's own posts and posts from followed users
  const feedPosts = await db.posts.findMany({
    where: {
      OR: [
        { authorId: { in: [...followingIds, userId] } },
        { authorId: userId }
      ],
      isVerified: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
          isVerified: true,
          verificationBadge: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
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

  const postsWithCounts = feedPosts.map((post: any) => ({
    ...post,
    commentsCount: post.__count?.comments,
    likesCount: post._count?.likes,
    _count: undefined,
  }));

  res.status(200).json(postsWithCounts);
};

const getNotifications = async (req: Request, res: Response):Promise<void> => {
  const userId = req.user as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const notifications = await db.notifications.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  // Mark notifications as read
  await db.notifications.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true }
  });

  res.status(200).json(notifications);
};

const getUnreadNotificationCount = async (req: Request, res: Response):Promise<void> => {
  const userId = req.user as string;

  const count = await db.notifications.count({
    where: {
      userId,
      isRead: false,
    }
  });

  res.status(200).json({ count });
};

const searchUsers = async (req: Request, res: Response):Promise<void> => {
  const { query } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  if (!query || typeof query !== 'string') {
    res.status(400).send({ message: 'Search query is required.' });
    return;
  }

  const users = await db.users.findMany({
    where: {
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
        }
      ]
    },
    take: limit,
    skip: (page - 1) * limit,
    select: {
      id: true,
      username: true,
      avatar: true,
      bio: true,
      isVerified: true,
      verificationBadge: true,
      role: true,
      skills: true,
      _count: {
        select: {
          posts: true,
          followers: true,
        }
      }
    }
  });

  const usersWithCounts = users.map((user: any) => ({
    ...user,
    postsCount: user._count?.posts,
    followersCount: user._count?.followers,
    _count: undefined,
  }));

  res.status(200).json(usersWithCounts);
};

export {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserFeed,
  getNotifications,
  getUnreadNotificationCount,
  searchUsers,
};