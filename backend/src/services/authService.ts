import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import speakeasy from 'speakeasy';
// import qrcode from 'qrcode';
import { SECRET } from '../utils/config';
import { prisma, db } from '../utils/prismaClient';

class AuthService {
  private prisma: any;
  private userModel: any;

  constructor() {
    this.prisma = prisma;
    // lightweight userModel wrapper to keep older code paths working
    this.userModel = {
      findById: async (id: string) => (this.prisma as any).users.findUnique({ where: { id } } as any),
      update: async (id: string, data: any) => (this.prisma as any).users.update({ where: { id }, data } as any),
      getProfile: async (id: string) => (this.prisma as any).users.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
          postKarma: true,
          commentKarma: true,
          tokens: true,
          isVerified: true,
          verificationBadge: true,
          portfolioUrl: true,
          skills: true,
          experience: true,
          location: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            }
          },
          createdAt: true,
        }
      } as any),
      verifyUser: async (id: string, badge?: string) => (this.prisma as any).users.update({ where: { id }, data: { isVerified: true, verificationBadge: badge || null } } as any),
      awardTokens: async (id: string, amount: number) => (this.prisma as any).users.update({ where: { id }, data: { tokens: { increment: amount } } } as any),
      awardKarma: async (id: string, type: 'post' | 'comment', amount: number) => {
        if (type === 'post') return (this.prisma as any).users.update({ where: { id }, data: { postKarma: { increment: amount } } } as any);
        return (this.prisma as any).users.update({ where: { id }, data: { commentKarma: { increment: amount } } } as any);
      }
    };
  }

  // Register new user
  async register(userData: {
    username: string;
    email: string;
    phone?: string;
    password: string;
    role?: 'DEVELOPER' | 'CLIENT' | 'ADMIN';
  }) {
    // Check if user already exists
    const existingUser = await (this.prisma as any).users.findFirst({
      where: {
        OR: [
          { username: { equals: userData.username, mode: 'insensitive' } },
          { email: userData.email }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.username.toLowerCase() === userData.username.toLowerCase() ? 'username' : 'email';
      throw new Error(`${field === 'username' ? 'Username' : 'Email'} already taken`);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = await (this.prisma as any).users.create({
      data: {
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        passwordHash,
        role: userData.role || 'DEVELOPER',
      }
    });

    // Generate token

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        tokens: user.tokens,
      }
    };
  }

  // Login user with security checks
  async login(credentials: { username: string; password: string; otp?: string }) {
    const user = await (this.prisma as any).users.findFirst({
      where: {
        username: { equals: credentials.username, mode: 'insensitive' }
      }
    });

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is temporarily locked due to too many failed attempts');
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      // Increment login attempts
      await db.users.update({
        where: { id: user.id },
        data: { loginAttempts: { increment: 1 } }
      });

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 4) {
        await db.users.update({
          where: { id: user.id },
          data: {
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
          }
        });
      }

      throw new Error('Invalid username or password');
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!credentials.otp) {
        throw new Error('Two-factor authentication code required');
      }

      // Simplified 2FA check (would use speakeasy in production)
      // const isValidOTP = this.verify2FA(user.twoFactorSecret!, credentials.otp);
      // For now, just check if OTP is provided
      if (!credentials.otp || credentials.otp.length !== 6) {
        throw new Error('Invalid two-factor authentication code');
      }
    }

    // Reset login attempts on successful login
    await (this.prisma as any).users.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        karma: user.postKarma + user.commentKarma,
        role: user.role,
        isVerified: user.isVerified,
        tokens: user.tokens,
      },
      token,
    };
  }

  // Enable 2FA
  async enable2FA(userId: string) {
  const user = await (this.prisma as any).users.findUnique({ where: { id: userId } } as any);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new Error('Two-factor authentication is already enabled');
    }

    // Generate a simple secret for demo (would use speakeasy in production)
    const secret = this.generateSimpleSecret();

    // Generate simple QR code URL (would use qrcode library in production)
    const otpauthUrl = `otpauth://totp/Magna%20Coders:${user.email}?secret=${secret}&issuer=Magna%20Coders`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    // Update user with temp secret (not yet enabled)
    await (this.prisma as any).users.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    });

    return {
      secret,
      qrCode: qrCodeUrl,
      otpauthUrl,
    };
  }

  // Verify and enable 2FA
  async verifyAndEnable2FA(userId: string, token: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new Error('Two-factor authentication setup not initiated');
    }

    const isValid = this.verify2FA(user.twoFactorSecret, token);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Enable 2FA
    await this.userModel.update(userId, {
      twoFactorEnabled: true,
      backupCodes,
    });

    return {
      message: 'Two-factor authentication enabled successfully',
      backupCodes,
    };
  }

  // Disable 2FA
  async disable2FA(userId: string, password: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    await this.userModel.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
    });

    return { message: 'Two-factor authentication disabled successfully' };
  }

  // Verify 2FA token
  async verify2FAToken(userId: string, token: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('Two-factor authentication not enabled');
    }

    return this.verify2FA(user.twoFactorSecret, token);
  }

  // Use backup code
  async useBackupCode(userId: string, code: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.twoFactorEnabled) {
      throw new Error('Two-factor authentication not enabled');
    }

    if (!user.backupCodes.includes(code)) {
      throw new Error('Invalid backup code');
    }

    // Remove used backup code
  const updatedCodes = user.backupCodes.filter((c: string) => c !== code);
    await this.userModel.update(userId, { backupCodes: updatedCodes });

    return { message: 'Backup code used successfully' };
  }

  // Generate OTP for password reset or verification
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via email
  async sendEmailOTP(email: string, otp: string): Promise<void> {
    // Implementation would use notification service
    console.log(`OTP sent to ${email}: ${otp}`);
  }

  // Send OTP via SMS
  async sendSMSOTP(phone: string, otp: string): Promise<void> {
    // Implementation would use notification service
    console.log(`OTP sent to ${phone}: ${otp}`);
  }

  // Verify OTP (would typically store in Redis/cache)
  async verifyOTP(identifier: string, otp: string): Promise<boolean> {
    // This is a simplified version - in production, use Redis or similar
    // to store OTPs with expiration
    return true; // Placeholder
  }

  // Get user profile
  async getProfile(userId: string) {
    const profile = await this.userModel.getProfile(userId);
    if (!profile) {
      throw new Error('User not found');
    }
    return profile;
  }

  // Update user profile
  async updateProfile(userId: string, updates: {
    bio?: string;
    portfolioUrl?: string;
    skills?: string[];
    experience?: string;
    location?: string;
    phone?: string;
  }) {
    const updatedUser = await this.userModel.update(userId, updates);
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      portfolioUrl: updatedUser.portfolioUrl,
      skills: updatedUser.skills,
      experience: updatedUser.experience,
      location: updatedUser.location,
    };
  }

  // Verify user account
  async verifyUser(userId: string, badge?: string) {
    await this.userModel.verifyUser(userId, badge);
    return { message: 'User verified successfully' };
  }

  // Award tokens to user
  async awardTokens(userId: string, amount: number, reason: string) {
    await this.userModel.awardTokens(userId, amount);

    // Create notification
    // This would be handled by the notification service

    return { message: `${amount} tokens awarded for ${reason}` };
  }

  // Award karma to user
  async awardKarma(userId: string, type: 'post' | 'comment', amount: number = 1) {
    await this.userModel.awardKarma(userId, type, amount);
    return { message: `${amount} karma awarded` };
  }

  // Generate JWT token
  private generateToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      SECRET,
      { expiresIn: '7d' }
    );
  }

  // Verify JWT token
  verifyToken(token: string) {
    try {
      return jwt.verify(token, SECRET) as { id: string };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Get user by token
  async getUserFromToken(token: string) {
    const decoded = this.verifyToken(token);
    return await this.userModel.findById(decoded.id);
  }

  // Private helper methods
  private verify2FA(secret: string, token: string): boolean {
    // Simplified 2FA verification for demo (would use speakeasy in production)
    // This is just a placeholder - in production, use proper TOTP verification
    return token.length === 6 && /^\d{6}$/.test(token);
  }

  private generateSimpleSecret(): string {
    // Generate a simple base32-like secret for demo
    return Math.random().toString(36).substring(2, 16).toUpperCase() +
           Math.random().toString(36).substring(2, 16).toUpperCase();
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}

export default AuthService;