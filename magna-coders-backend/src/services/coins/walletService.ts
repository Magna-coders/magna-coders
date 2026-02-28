import { PrismaClient } from '@prisma/client';
import {
  WalletStatus,
  TransactionDirection,
  TransactionStatus,
  CoinWallet,
  CreditWalletInput,
  DebitWalletInput,
} from '../../types/coins';

const prisma = new PrismaClient();

export class WalletService {
  static async getOrCreateWallet(user_id: string): Promise<CoinWallet> {
    let wallet = await prisma.coin_wallets.findUnique({
      where: { user_id },
    });

    if (!wallet) {
      wallet = await prisma.coin_wallets.create({
        data: {
          id: crypto.randomUUID(),
          user_id,
          balance: 0,
          max_capacity: 10000,
          status: WalletStatus.ACTIVE,
        },
      });
    }

    return this.toWallet(wallet);
  }

  static async getWallet(user_id: string): Promise<CoinWallet | null> {
    const wallet = await prisma.coin_wallets.findUnique({
      where: { user_id },
    });

    return wallet ? this.toWallet(wallet) : null;
  }

  static async creditWallet(input: CreditWalletInput): Promise<CoinWallet> {
    const { user_id, amount, type, reference_id, idempotency_key, description } = input;

    if (idempotency_key) {
      const existing = await prisma.coin_transactions.findUnique({
        where: { idempotency_key },
      });
      if (existing) {
        return this.getOrCreateWallet(user_id);
      }
    }

    const wallet = await this.getOrCreateWallet(user_id);
    const newBalance = wallet.balance + amount;

    if (newBalance > wallet.max_capacity) {
      throw new Error('Wallet capacity exceeded');
    }

    await prisma.$transaction(async (tx) => {
      await tx.coin_wallets.update({
        where: { user_id },
        data: { balance: newBalance },
      });

      await tx.coin_transactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id,
          type,
          amount,
          direction: TransactionDirection.IN,
          status: TransactionStatus.COMPLETED,
          reference_id,
          idempotency_key,
          description,
        },
      });
    });

    return this.getOrCreateWallet(user_id);
  }

  static async debitWallet(input: DebitWalletInput): Promise<CoinWallet> {
    const { user_id, amount, type, reference_id, idempotency_key, description } = input;

    if (idempotency_key) {
      const existing = await prisma.coin_transactions.findUnique({
        where: { idempotency_key },
      });
      if (existing) {
        return this.getOrCreateWallet(user_id);
      }
    }

    const wallet = await this.getOrCreateWallet(user_id);

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new Error('Wallet is not active');
    }

    const newBalance = wallet.balance - amount;

    await prisma.$transaction(async (tx) => {
      await tx.coin_wallets.update({
        where: { user_id },
        data: { balance: newBalance },
      });

      await tx.coin_transactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id,
          type,
          amount,
          direction: TransactionDirection.OUT,
          status: TransactionStatus.COMPLETED,
          reference_id,
          idempotency_key,
          description,
        },
      });
    });

    return this.getOrCreateWallet(user_id);
  }

  static async freezeWallet(user_id: string): Promise<CoinWallet> {
    const wallet = await prisma.coin_wallets.update({
      where: { user_id },
      data: { status: WalletStatus.FROZEN },
    });

    return this.toWallet(wallet);
  }

  static async unfreezeWallet(user_id: string): Promise<CoinWallet> {
    const wallet = await prisma.coin_wallets.update({
      where: { user_id },
      data: { status: WalletStatus.ACTIVE },
    });

    return this.toWallet(wallet);
  }

  static async getTransactionHistory(
    user_id: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ transactions: unknown[]; total: number }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [transactions, total] = await Promise.all([
      prisma.coin_transactions.findMany({
        where: { user_id },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.coin_transactions.count({ where: { user_id } }),
    ]);

    return { transactions, total };
  }

  private static toWallet(wallet: {
    id: string;
    user_id: string;
    balance: { toNumber: () => number };
    max_capacity: { toNumber: () => number };
    status: string;
    created_at: Date;
    updated_at: Date;
  }): CoinWallet {
    return {
      id: wallet.id,
      user_id: wallet.user_id,
      balance: wallet.balance.toNumber(),
      max_capacity: wallet.max_capacity.toNumber(),
      status: wallet.status as WalletStatus,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at,
    };
  }
}
