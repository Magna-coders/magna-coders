import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InAppService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Get notification by ID
  async getNotificationById(notificationId: string) {
    try {
      const notification = await this.prisma.notifications.findUnique({
        where: { id: notificationId },
      });
      return notification;
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw new Error('Failed to fetch notification');
    }
  }

  // Create in-app notification
  async createInAppNotification(data: {
    userId: string;
    type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'PROJECT_BID' | 'PROJECT_ASSIGNED' | 'PROJECT_COMPLETED' | 'MESSAGE' | 'SYSTEM';
    title: string;
    message: string;
    postId?: string;
    commentId?: string;
    projectId?: string;
    messageId?: string;
  }): Promise<void> {
    await this.prisma.notifications.create({
      data: {
        user_id: data.userId,
        title: data.title,
        message: data.message,
      } as any, // id is auto-generated, type assertion to satisfy TS
    });
  }

  // Bulk notification sender
  async sendBulkNotification(userIds: string[], notification: {
    type: string;
    title: string;
    message: string;
  }): Promise<void> {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title: notification.title,
      message: notification.message,
    }));

    await this.prisma.notifications.createMany({
      data: notifications as any, // id is auto-generated, type assertion to satisfy TS
    });
  }

  // Get user's notification preferences
  async getUserNotificationPreferences(userId: string): Promise<any> {
    return {
      email: true,
      sms: false,
      whatsapp: false,
      inApp: true,
      marketing: false,
    };
  }
}