import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { PrismaClient } from '@prisma/client';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../utils/config';

const prisma = new PrismaClient();

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// SMS configuration (Twilio)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// WhatsApp configuration (using Twilio)
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

class NotificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Send email notification
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  // Send SMS notification
  async sendSMS(to: string, message: string): Promise<void> {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      console.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new Error('Failed to send SMS');
    }
  }

  // Send WhatsApp message
  async sendWhatsApp(to: string, message: string): Promise<void> {
    try {
      const whatsappTo = `whatsapp:${to}`;
      await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${whatsappNumber}`,
        to: whatsappTo,
      });
      console.log(`WhatsApp message sent successfully to ${to}`);
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  // Send OTP via email
  async sendEmailOTP(email: string, otp: string): Promise<void> {
    const subject = 'Your OTP Code - Magna Coders';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for Magna Coders is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Magna Coders Team</p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  // Send OTP via SMS
  async sendSMSOTP(phone: string, otp: string): Promise<void> {
    const message = `Your Magna Coders OTP is: ${otp}. Valid for 10 minutes.`;
    await this.sendSMS(phone, message);
  }

  // Send OTP via WhatsApp
  async sendWhatsAppOTP(phone: string, otp: string): Promise<void> {
    const message = `🔐 Your Magna Coders OTP is: *${otp}*\n\nValid for 10 minutes.\n\nIf you didn't request this, please ignore.`;
    await this.sendWhatsApp(phone, message);
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

  // Send welcome notification
  async sendWelcomeNotification(userId: string, userEmail: string, userPhone?: string): Promise<void> {
    // In-app notification
    await this.createInAppNotification({
      userId,
      type: 'SYSTEM',
      title: 'Welcome to Magna Coders!',
      message: 'Thank you for joining our community. Start exploring projects and connecting with developers!',
    });

    // Email welcome
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Magna Coders! 🎉</h2>
        <p>Hi there,</p>
        <p>Welcome to the Magna Coders community! We're excited to have you join our platform where developers and clients connect.</p>

        <h3>What you can do:</h3>
        <ul>
          <li>Post your projects and find talented developers</li>
          <li>Showcase your skills and get hired</li>
          <li>Connect with like-minded professionals</li>
          <li>Earn tokens and build your reputation</li>
        </ul>

        <p>Get started by completing your profile and exploring available projects!</p>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Go to Dashboard
        </a>

        <br><br>
        <p>Best regards,<br>The Magna Coders Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, 'Welcome to Magna Coders!', welcomeHtml);

    // SMS welcome (if phone provided)
    if (userPhone) {
      await this.sendSMS(userPhone, 'Welcome to Magna Coders! 🎉 Your developer journey starts now. Visit your dashboard to get started.');
    }
  }

  // Send project bid notification
  async sendProjectBidNotification(projectOwnerId: string, bidderName: string, projectTitle: string, bidAmount: number): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: projectOwnerId } });

    if (!user) return;

    // In-app notification
    await this.createInAppNotification({
      userId: projectOwnerId,
      type: 'PROJECT_BID',
      title: 'New Project Bid',
      message: `${bidderName} placed a bid of $${bidAmount} on your project "${projectTitle}"`,
    });

    // Email notification
    const bidHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Project Bid!</h2>
        <p>Hi ${user.username},</p>
        <p>Great news! <strong>${bidderName}</strong> has placed a bid on your project <strong>"${projectTitle}"</strong>.</p>

        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Bid Details:</h3>
          <p><strong>Bidder:</strong> ${bidderName}</p>
          <p><strong>Amount:</strong> $${bidAmount}</p>
        </div>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects"
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          View All Bids
        </a>

        <br><br>
        <p>Best regards,<br>Magna Coders Team</p>
      </div>
    `;

    await this.sendEmail(user.email, 'New Project Bid - Magna Coders', bidHtml);

    // SMS notification (if phone available)
    // phone is not in users model, so skip SMS
  }

  // Send project assignment notification
  async sendProjectAssignmentNotification(developerId: string, projectTitle: string, clientName: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: developerId } });

    if (!user) return;

    // In-app notification
    await this.createInAppNotification({
      userId: developerId,
      type: 'PROJECT_ASSIGNED',
      title: 'Project Assigned!',
      message: `Congratulations! You've been assigned to project "${projectTitle}" by ${clientName}`,
    });

    // Email notification
    const assignmentHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Project Assigned!</h2>
        <p>Hi ${user.username},</p>
        <p>Congratulations! You've been selected for the project <strong>"${projectTitle}"</strong> by <strong>${clientName}</strong>.</p>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #155724;">What's Next?</h3>
          <ul style="color: #155724;">
            <li>Contact your client to discuss project details</li>
            <li>Review project requirements and timeline</li>
            <li>Start working on the project</li>
            <li>Keep regular communication with your client</li>
          </ul>
        </div>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects"
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          View Project Details
        </a>

        <br><br>
        <p>Best regards,<br>Magna Coders Team</p>
      </div>
    `;

    await this.sendEmail(user.email, 'Project Assigned - Magna Coders', assignmentHtml);

    // SMS notification
    // phone is not in users model, so skip SMS
  }

  // Send security alert (2FA, login from new device, etc.)
  async sendSecurityAlert(userId: string, alertType: string, details: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });

    if (!user) return;

    // In-app notification
    await this.createInAppNotification({
      userId,
      type: 'SYSTEM',
      title: 'Security Alert',
      message: `Security alert: ${alertType}. ${details}`,
    });

    // Email alert
    const alertHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Security Alert ⚠️</h2>
        <p>Hi ${user.username},</p>
        <p>We detected a security-related activity on your account:</p>

        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #721c24;">Alert Details:</h3>
          <p style="color: #721c24;"><strong>Type:</strong> ${alertType}</p>
          <p style="color: #721c24;"><strong>Details:</strong> ${details}</p>
        </div>

        <p>If this wasn't you, please:</p>
        <ol>
          <li>Change your password immediately</li>
          <li>Review your account activity</li>
          <li>Contact our support team</li>
        </ol>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/security"
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Review Security Settings
        </a>

        <br><br>
        <p>Best regards,<br>Magna Coders Security Team</p>
      </div>
    `;

    await this.sendEmail(user.email, 'Security Alert - Magna Coders', alertHtml);

    // SMS alert (high priority)
    // phone is not in users model, so skip SMS
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

export default NotificationService;