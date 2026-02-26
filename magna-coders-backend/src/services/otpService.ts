// import crypto from 'crypto';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// interface OTPOptions {
//   length?: number;
//   expiresIn?: number; // minutes
//   type?: 'numeric' | 'alphanumeric';
// }

// class OTPService {
//   private prisma: PrismaClient;

//   constructor() {
//     this.prisma = prisma;
//   }

//   // Generate OTP
//   generateOTP(options: OTPOptions = {}): string {
//     const {
//       length = 6,
//       type = 'numeric'
//     } = options;

//     if (type === 'numeric') {
//       return Math.floor(Math.random() * Math.pow(10, length))
//         .toString()
//         .padStart(length, '0');
//     } else {
//       return crypto.randomBytes(length).toString('hex').toUpperCase().substring(0, length);
//     }
//   }

//   // Store OTP in database (for verification)
//   async storeOTP(identifier: string, otp: string, expiresIn: number = 10): Promise<void> {
//     const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

//     // For demo purposes, we'll store in a simple in-memory map
//     // In production, you'd want to use Redis or a proper cache
//     this.otpStore.set(`${identifier}:${otp}`, { expiresAt });
//   }

//   // Verify OTP
//   async verifyOTP(identifier: string, otp: string): Promise<boolean> {
//     const key = `${identifier}:${otp}`;
//     const stored = this.otpStore.get(key);

//     if (!stored) {
//       return false;
//     }

//     if (stored.expiresAt < new Date()) {
//       this.otpStore.delete(key);
//       return false;
//     }

//     // OTP is valid, remove it (one-time use)
//     this.otpStore.delete(key);
//     return true;
//   }

//   // Send OTP via Email
//   async sendEmailOTP(email: string, otp: string, subject: string = 'Your OTP Code'): Promise<void> {
//     const html = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #333;">${subject}</h2>
//         <p>Hello,</p>
//         <p>Your One-Time Password (OTP) is:</p>
//         <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
//           <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
//         </div>
//         <p>This code will expire in 10 minutes.</p>
//         <p>If you didn't request this code, please ignore this email.</p>
//         <br>
//         <p>Best regards,<br>Magna Coders Team</p>
//       </div>
//     `;

//     // In production, integrate with actual email service
//     console.log(`📧 Email OTP sent to ${email}: ${otp}`);

//     // Store OTP for verification
//     await this.storeOTP(email, otp);
//   }

//   // Send OTP via SMS
//   async sendSMSOTP(phone: string, otp: string): Promise<void> {
//     const message = `Your Magna Coders OTP is: ${otp}. Valid for 10 minutes.`;

//     // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
//     console.log(`📱 SMS OTP sent to ${phone}: ${otp}`);

//     // Store OTP for verification
//     await this.storeOTP(phone, otp);
//   }

//   // Send OTP via WhatsApp
//   async sendWhatsAppOTP(phone: string, otp: string): Promise<void> {
//     const message = `🔐 Your Magna Coders OTP is: *${otp}*\n\nValid for 10 minutes.\n\nIf you didn't request this, please ignore.`;

//     // In production, integrate with WhatsApp Business API
//     console.log(`💬 WhatsApp OTP sent to ${phone}: ${otp}`);

//     // Store OTP for verification
//     await this.storeOTP(phone, otp);
//   }

//   // Request OTP (chooses delivery method based on user preference)
//   async requestOTP(identifier: string, deliveryMethod: 'email' | 'sms' | 'whatsapp' = 'email'): Promise<void> {
//     const otp = this.generateOTP({ length: 6, type: 'numeric' });

//     switch (deliveryMethod) {
//       case 'email':
//         await this.sendEmailOTP(identifier, otp);
//         break;
//       case 'sms':
//         await this.sendSMSOTP(identifier, otp);
//         break;
//       case 'whatsapp':
//         await this.sendWhatsAppOTP(identifier, otp);
//         break;
//       default:
//         throw new Error('Invalid delivery method');
//     }
//   }

//   // Verify OTP with cleanup
//   async verifyAndCleanOTP(identifier: string, otp: string): Promise<boolean> {
//     const isValid = await this.verifyOTP(identifier, otp);

//     if (isValid) {
//       // Clean up any remaining OTPs for this identifier
//       const keysToDelete: string[] = [];
//       for (const [key] of this.otpStore) {
//         if (key.startsWith(`${identifier}:`)) {
//           keysToDelete.push(key);
//         }
//       }
//       keysToDelete.forEach(key => this.otpStore.delete(key));
//     }

//     return isValid;
//   }

//   // Clean up expired OTPs (should be called periodically)
//   cleanupExpiredOTPs(): void {
//     const now = new Date();
//     const keysToDelete: string[] = [];

//     for (const [key, value] of this.otpStore) {
//       if (value.expiresAt < now) {
//         keysToDelete.push(key);
//       }
//     }

//     keysToDelete.forEach(key => this.otpStore.delete(key));

//     if (keysToDelete.length > 0) {
//       console.log(`🧹 Cleaned up ${keysToDelete.length} expired OTPs`);
//     }
//   }

//   // Get OTP status (for debugging)
//   getOTPStatus(identifier: string): { count: number; expiresAt?: Date } {
//     let count = 0;
//     let earliestExpiry: Date | undefined;

//     for (const [key, value] of this.otpStore) {
//       if (key.startsWith(`${identifier}:`)) {
//         count++;
//         if (!earliestExpiry || value.expiresAt < earliestExpiry) {
//           earliestExpiry = value.expiresAt;
//         }
//       }
//     }

//     return { count, expiresAt: earliestExpiry };
//   }

//   // In-memory OTP store (use Redis in production)
//   private otpStore = new Map<string, { expiresAt: Date }>();

//   // Initialize cleanup interval
//   initCleanupInterval(): void {
//     // Clean up expired OTPs every 5 minutes
//     setInterval(() => {
//       this.cleanupExpiredOTPs();
//     }, 5 * 60 * 1000);
//   }
// }

// export default OTPService;