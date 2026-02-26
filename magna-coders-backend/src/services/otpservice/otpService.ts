import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OTPOptions {
  length?: number;
  expiresIn?: number; // minutes
  type?: 'numeric' | 'alphanumeric';
}

class OTPService {
  private prisma: PrismaClient;
  private otpStore: Map<string, { expiresAt: Date }> = new Map();

  constructor() {
    this.prisma = prisma;
  }

  // Generate OTP
  generateOTP(options: OTPOptions = {}): string {
    const {
      length = 6,
      type = 'numeric'
    } = options;

    if (type === 'numeric') {
      return Math.floor(Math.random() * Math.pow(10, length))
        .toString()
        .padStart(length, '0');
    } else {
      return crypto.randomBytes(length).toString('hex').toUpperCase().substring(0, length);
    }
  }

  // Store OTP in database (for verification)
  async storeOTP(identifier: string, otp: string, expiresIn: number = 10): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

    // For demo purposes, we'll store in a simple in-memory map
    // In production, you'd want to use Redis or a proper cache for 
    // scalability naitakuwa easy
    this.otpStore.set(`${identifier}:${otp}`, { expiresAt });
  }

  // Verify OTP
  async verifyOTP(identifier: string, otp: string): Promise<boolean> {
    const key = `${identifier}:${otp}`;
    const stored = this.otpStore.get(key);

    if (!stored) {
      return false;
    }

    if (stored.expiresAt < new Date()) {
      this.otpStore.delete(key);
      return false;
    }

    // OTP is valid, remove it (one-time use)
    this.otpStore.delete(key);
    return true;
  }

  // Send OTP via Email
  async sendEmailOTP(identifier: string, otp: string, subject: string = 'Your OTP Code'): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${subject}</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Magna Coders Team</p>
      </div>
    `;

    // In production, integrate with actual email service
    console.log(`📧 Email OTP sent to ${identifier}: ${otp}`);

    // Store OTP for verification
    await this.storeOTP(identifier, otp);
  }

  // Send OTP via SMS
  async sendSMSOTP(identifier: string, otp: string): Promise<void> {
    const message = `Your Magna Coders OTP is: ${otp}. Valid for 10 minutes.`;

    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 SMS OTP sent to ${identifier}: ${otp}`);

    // Store OTP for verification
    await this.storeOTP(identifier, otp);
  }

  // Send OTP via WhatsApp
  async sendWhatsAppOTP(identifier: string, otp: string): Promise<void> {
    const message = `🔐 Your Magna Coders OTP is: *${otp}*\n\nValid for 10 minutes.\n\nIf you didn't request this, please ignore.`;

    // In production, integrate with WhatsApp service
    console.log(`📱 WhatsApp OTP sent to ${identifier}: ${otp}`);

    // Store OTP for verification
    await this.storeOTP(identifier, otp);
  }

  // Send OTP via multiple channels
  async sendMultiChannelOTP(identifier: string, otp: string, channels: ('email' | 'sms' | 'whatsapp')[]): Promise<void> {
    const promises = channels.map(channel => {
      switch (channel) {
        case 'email':
          return this.sendEmailOTP(identifier, otp);
        case 'sms':
          return this.sendSMSOTP(identifier, otp);
        case 'whatsapp':
          return this.sendWhatsAppOTP(identifier, otp);
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    });

    await Promise.all(promises);
  }

  // Clean up expired OTPs (should be called periodically)
  cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [key, value] of this.otpStore.entries()) {
      if (value.expiresAt < now) {
        this.otpStore.delete(key);
      }
    }
  }

  // Get OTP statistics
  getOTPStats(): { active: number; total: number } {
    const now = new Date();
    let active = 0;
    for (const value of this.otpStore.values()) {
      if (value.expiresAt > now) active += 1;
    }

    const total = this.otpStore.size;
    return { active, total };
  }


}

export default OTPService;
export { OTPService };