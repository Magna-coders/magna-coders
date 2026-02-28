import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const notifications = await prisma.notifications.findMany({
      where: { user_id: userId },
      include: {
        applications: {
          include: {
            users: { select: { id: true, username: true, avatar_url: true } },
            opportunities: { select: { id: true, title: true, author_id: true } }
          }
        },
        opportunities: {
          select: { id: true, title: true, author_id: true }
        },
        projects: {
          select: { id: true, title: true, owner_id: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    // Get friend requests for this user
    const friendRequests = await prisma.friend_requests.findMany({
      where: {
        receiver_id: userId,
        status: 'pending'
      },
      include: {
        users_friend_requests_sender_idTousers: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            bio: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      notifications,
      friendRequests: friendRequests.map(req => ({
        id: req.id,
        sender: req.users_friend_requests_sender_idTousers,
        createdAt: req.created_at
      })),
      unreadCount: notifications.filter(n => !n.is_read).length
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    if (notification.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    await prisma.notifications.update({
      where: { id: notificationId },
      data: { is_read: true }
    });

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false
      },
      data: { is_read: true }
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    if (notification.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    await prisma.notifications.delete({
      where: { id: notificationId }
    });

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};
