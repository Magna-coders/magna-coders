import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PaymentData {
  amount: number;
  description?: string;
  fromUserId: string;
  toUserId?: string;
  projectId?: string;
}

interface WalletTransferRequest {
  amount: number;
  description?: string;
  fromUserId: string;
  toUserId: string;
  projectId?: string;
}

interface WalletTransferResponse {
  paymentId: string;
  status: string;
  message: string;
  timestamp: number;
  amount: number;
  fromUserId: string;
  toUserId: string;
}

interface WalletBalanceResponse {
  balance: number;
  created_at: Date | null;
  updated_at: Date | null;
  userId: string;
}

interface WalletError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[WALLET INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[WALLET ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WALLET WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

export const processWalletPayment = async (data: WalletTransferRequest): Promise<WalletTransferResponse> => {
  try {
    if (!data.fromUserId || !data.toUserId) {
      const error: WalletError = {
        code: 'INVALID_REQUEST',
        message: 'Sender and recipient user IDs are required',
        statusCode: 400,
        details: { fromUserId: data.fromUserId, toUserId: data.toUserId }
      };
      logger.error('Invalid wallet transfer request', error);
      throw error;
    }

    if (data.amount <= 0) {
      const error: WalletError = {
        code: 'INVALID_AMOUNT',
        message: 'Transfer amount must be greater than 0',
        statusCode: 400,
        details: { amount: data.amount }
      };
      logger.error('Invalid transfer amount', error);
      throw error;
    }

    if (data.fromUserId === data.toUserId) {
      const error: WalletError = {
        code: 'SELF_TRANSFER',
        message: 'Cannot transfer to the same user',
        statusCode: 400,
        details: { userId: data.fromUserId }
      };
      logger.error('Self transfer attempt', error);
      throw error;
    }

    logger.info('Processing wallet transfer', {
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      amount: data.amount
    });

    const senderWallet = await prisma.wallets.findUnique({
      where: { user_id: data.fromUserId }
    });

    if (!senderWallet) {
      const error: WalletError = {
        code: 'SENDER_WALLET_NOT_FOUND',
        message: 'Sender wallet not found',
        statusCode: 404,
        details: { userId: data.fromUserId }
      };
      logger.error('Sender wallet not found', error);
      throw error;
    }

    if (Number(senderWallet.balance) < data.amount) {
      const error: WalletError = {
        code: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient wallet balance',
        statusCode: 400,
        details: {
          userId: data.fromUserId,
          balance: senderWallet.balance,
          required: data.amount
        }
      };
      logger.error('Insufficient balance', error);
      throw error;
    }

    const recipientWallet = await prisma.wallets.findUnique({
      where: { user_id: data.toUserId }
    });

    if (!recipientWallet) {
      const error: WalletError = {
        code: 'RECIPIENT_WALLET_NOT_FOUND',
        message: 'Recipient wallet not found',
        statusCode: 404,
        details: { userId: data.toUserId }
      };
      logger.error('Recipient wallet not found', error);
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.wallets.update({
        where: { user_id: data.fromUserId },
        data: { balance: { decrement: data.amount } }
      });

      await tx.wallets.update({
        where: { user_id: data.toUserId },
        data: { balance: { increment: data.amount } }
      });
    });

    const response: WalletTransferResponse = {
      paymentId: `WALLET-${Date.now()}`,
      status: 'COMPLETED',
      message: 'Wallet transfer completed successfully',
      timestamp: Date.now(),
      amount: data.amount,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId
    };

    logger.info('Wallet transfer completed successfully', {
      paymentId: response.paymentId,
      amount: data.amount
    });

    return response;

  } catch (error: any) {
    if (error.code && error.statusCode) {
      throw error;
    }

    logger.error('Database error in processWalletPayment', error);

    const dbError: WalletError = {
      code: 'DATABASE_ERROR',
      message: 'An error occurred while processing the wallet transfer',
      statusCode: 500,
      details: error.message
    };
    throw dbError;
  }
};

export const getWalletBalance = async (userId: string): Promise<WalletBalanceResponse> => {
  try {
    if (!userId || typeof userId !== 'string') {
      const error: WalletError = {
        code: 'INVALID_USER_ID',
        message: 'Valid user ID is required',
        statusCode: 400,
        details: { userId }
      };
      logger.error('Invalid user ID for balance check', error);
      throw error;
    }

    logger.info('Fetching wallet balance', { userId });

    const wallet = await prisma.wallets.findUnique({
      where: { user_id: userId },
      select: {
        balance: true,
        created_at: true,
        updated_at: true,
      }
    });

    if (!wallet) {
      logger.info('Wallet not found, creating new wallet', { userId });

      const newWallet = await prisma.wallets.create({
        data: {
          id: `wallet-${userId}-${Date.now()}`,
          user_id: userId,
          balance: 0.0
        },
        select: {
          balance: true,
          created_at: true,
          updated_at: true,
        }
      });

      const response: WalletBalanceResponse = {
        balance: Number(newWallet.balance),
        created_at: newWallet.created_at,
        updated_at: newWallet.updated_at,
        userId: userId
      };

      logger.info('New wallet created', { userId, balance: response.balance });
      return response;
    }

    const response: WalletBalanceResponse = {
      balance: Number(wallet.balance),
      created_at: wallet.created_at,
      updated_at: wallet.updated_at,
      userId: userId
    };

    logger.info('Wallet balance retrieved', { userId, balance: response.balance });
    return response;

  } catch (error: any) {
    if (error.code && error.statusCode) {
      throw error;
    }

    logger.error('Database error in getWalletBalance', error);

    const dbError: WalletError = {
      code: 'DATABASE_ERROR',
      message: 'An error occurred while fetching wallet balance',
      statusCode: 500,
      details: error.message
    };
    throw dbError;
  }
};