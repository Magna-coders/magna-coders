import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// TypeScript interfaces
interface LogoutRequest {
  userId: string;
  token?: string;
}

interface LogoutResponse {
  message: string;
  success: boolean;
}

interface LogoutError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Logger utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[LOGOUT INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[LOGOUT ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[LOGOUT WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

export async function logout(userId: LogoutRequest | string): Promise<LogoutResponse> {
  try {
    const request: LogoutRequest = typeof userId === 'string' ? { userId } : userId;

    if (!request.userId) {
      const error: LogoutError = {
        code: 'INVALID_USER_ID',
        message: 'Valid user ID is required',
        statusCode: 400
      };
      logger.error('Invalid user ID for logout', error);
      throw error;
    }

    logger.info('Processing logout', { userId: request.userId });

    // TODO: Invalidate refresh tokens when refresh_tokens table is added to schema
    // const invalidatedTokens = await prisma.refresh_tokens.updateMany({
    //   where: {
    //     userId: request.userId,
    //     revoked: false
    //   },
    //   data: {
    //     revoked: true
    //   }
    // });

    // logger.info('Refresh tokens invalidated', {
    //   userId: request.userId,
    //   tokensInvalidated: invalidatedTokens.count
    // });

    // TODO: Implement access token blacklisting if needed
    // This would require a separate table for blacklisted tokens
    // if (request.token) {
    //   await blacklistToken(request.token);
    // }

    // Optional: Update user's last logout time or online status
    // await prisma.users.update({
    //   where: { id: request.userId },
    //   data: { last_logout: new Date() }
    // });

    const response: LogoutResponse = {
      message: 'Logged out successfully',
      success: true
    };

    logger.info('Logout completed successfully', { userId: request.userId });

    return response;

  } catch (error: any) {
    if (error.code && error.statusCode) {
      throw error;
    }

    logger.error('Database error in logout', error);

    const dbError: LogoutError = {
      code: 'DATABASE_ERROR',
      message: 'An error occurred during logout',
      statusCode: 500,
      details: error.message
    };
    throw dbError;
  }
}