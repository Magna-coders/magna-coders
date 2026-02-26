import { PrismaClient } from '@prisma/client';
import {
  CoinPackage,
  CoinOrder,
  OrderStatus,
  PaymentMethod,
  CreateOrderInput,
} from '../../types/coins';

const prisma = new PrismaClient();

export class PackageService {
  static async getPackages(): Promise<CoinPackage[]> {
    const packages = await prisma.coin_packages.findMany({
      where: { is_active: true },
      orderBy: { base_coins: 'asc' },
    });

    return packages.map(this.toPackage);
  }

  static async getPackageById(id: string): Promise<CoinPackage | null> {
    const pkg = await prisma.coin_packages.findUnique({
      where: { id },
    });

    return pkg ? this.toPackage(pkg) : null;
  }

  static async createOrder(input: CreateOrderInput): Promise<CoinOrder> {
    const { user_id, package_id, payment_method } = input;

    const pkg = await this.getPackageById(package_id);
    if (!pkg) {
      throw new Error('Package not found');
    }

    const order = await prisma.coin_orders.create({
      data: {
        id: crypto.randomUUID(),
        user_id,
        package_id,
        amount_kes: pkg.price_kes,
        coins_credited: 0,
        status: OrderStatus.PENDING,
        payment_method,
      },
    });

    return this.toOrder(order);
  }

  static async getOrderById(id: string): Promise<CoinOrder | null> {
    const order = await prisma.coin_orders.findUnique({
      where: { id },
    });

    return order ? this.toOrder(order) : null;
  }

  static async getOrdersByUser(
    user_id: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ orders: CoinOrder[]; total: number }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [orders, total] = await Promise.all([
      prisma.coin_orders.findMany({
        where: { user_id },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.coin_orders.count({ where: { user_id } }),
    ]);

    return {
      orders: orders.map(this.toOrder),
      total,
    };
  }

  static async processPaymentCallback(
    order_id: string,
    payment_ref: string,
    success: boolean
  ): Promise<CoinOrder> {
    const order = await this.getOrderById(order_id);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Order already processed');
    }

    if (!success) {
      const updated = await prisma.coin_orders.update({
        where: { id: order_id },
        data: {
          status: OrderStatus.FAILED,
          payment_ref,
        },
      });
      return this.toOrder(updated);
    }

    const pkg = await this.getPackageById(order.package_id);
    if (!pkg) {
      throw new Error('Package not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.coin_orders.update({
        where: { id: order_id },
        data: {
          status: OrderStatus.COMPLETED,
          coins_credited: pkg.total_coins,
          payment_ref,
        },
      });

      const wallet = await tx.coin_wallets.findUnique({
        where: { user_id: order.user_id },
      });

      if (!wallet) {
        await tx.coin_wallets.create({
          data: {
            id: crypto.randomUUID(),
            user_id: order.user_id,
            balance: pkg.total_coins,
            max_capacity: 10000,
            status: 'ACTIVE',
          },
        });
      } else {
        await tx.coin_wallets.update({
          where: { user_id: order.user_id },
          data: {
            balance: { increment: pkg.total_coins },
          },
        });
      }

      await tx.coin_transactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: order.user_id,
          type: 'PURCHASE',
          amount: pkg.total_coins,
          direction: 'IN',
          status: 'COMPLETED',
          reference_id: order_id,
          description: `Purchased ${pkg.total_coins} coins`,
        },
      });
    });

    const updated = await this.getOrderById(order_id);
    return updated!;
  }

  static async createPackage(input: {
    base_coins: number;
    bonus_coins?: number;
    price_kes: number;
  }): Promise<CoinPackage> {
    const { base_coins, bonus_coins = 0, price_kes } = input;

    const pkg = await prisma.coin_packages.create({
      data: {
        id: crypto.randomUUID(),
        base_coins,
        bonus_coins,
        total_coins: base_coins + bonus_coins,
        price_kes,
        is_active: true,
      },
    });

    return this.toPackage(pkg);
  }

  static async updatePackage(
    id: string,
    input: { base_coins?: number; bonus_coins?: number; price_kes?: number; is_active?: boolean }
  ): Promise<CoinPackage> {
    const existing = await prisma.coin_packages.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Package not found');
    }

    const base_coins = input.base_coins ?? existing.base_coins;
    const bonus_coins = input.bonus_coins ?? existing.bonus_coins;

    const pkg = await prisma.coin_packages.update({
      where: { id },
      data: {
        ...input,
        total_coins: base_coins + bonus_coins,
      },
    });

    return this.toPackage(pkg);
  }

  private static toPackage(pkg: {
    id: string;
    base_coins: number;
    bonus_coins: number;
    total_coins: number;
    price_kes: { toNumber: () => number };
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): CoinPackage {
    return {
      id: pkg.id,
      base_coins: pkg.base_coins,
      bonus_coins: pkg.bonus_coins,
      total_coins: pkg.total_coins,
      price_kes: pkg.price_kes.toNumber(),
      is_active: pkg.is_active,
      created_at: pkg.created_at,
      updated_at: pkg.updated_at,
    };
  }

  private static toOrder(order: {
    id: string;
    user_id: string;
    package_id: string;
    amount_kes: { toNumber: () => number };
    coins_credited: number;
    status: string;
    payment_method: string | null;
    payment_ref: string | null;
    created_at: Date;
    updated_at: Date;
  }): CoinOrder {
    return {
      id: order.id,
      user_id: order.user_id,
      package_id: order.package_id,
      amount_kes: order.amount_kes.toNumber(),
      coins_credited: order.coins_credited,
      status: order.status as OrderStatus,
      payment_method: order.payment_method as PaymentMethod | undefined,
      payment_ref: order.payment_ref || undefined,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}