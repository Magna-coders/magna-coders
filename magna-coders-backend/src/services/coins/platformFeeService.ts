import { PrismaClient } from '@prisma/client';
import { PlatformFee, AdminAction } from '../../types/coins';

const prisma = new PrismaClient();

const PLATFORM_FEE_PERCENTAGE = 5;

export class PlatformFeeService {
  static async calculateFee(amount: number): Promise<{ fee: number; net: number }> {
    const fee = Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100);
    const net = amount - fee;
    return { fee, net };
  }

  static async deductPlatformFee(
    contract_id: string,
    amount: number
  ): Promise<PlatformFee> {
    const { fee } = await this.calculateFee(amount);

    const platformFee = await prisma.platform_fees.create({
      data: {
        id: crypto.randomUUID(),
        contract_id,
        amount: fee,
        percentage: PLATFORM_FEE_PERCENTAGE,
      },
    });

    return {
      id: platformFee.id,
      contract_id: platformFee.contract_id,
      amount: platformFee.amount.toNumber(),
      percentage: platformFee.percentage.toNumber(),
      created_at: platformFee.created_at,
    };
  }

  static async getPlatformFeesByContract(contract_id: string): Promise<PlatformFee[]> {
    const fees = await prisma.platform_fees.findMany({
      where: { contract_id },
      orderBy: { created_at: 'desc' },
    });

    return fees.map((f) => ({
      id: f.id,
      contract_id: f.contract_id,
      amount: f.amount.toNumber(),
      percentage: f.percentage.toNumber(),
      created_at: f.created_at,
    }));
  }

  static async getTotalPlatformFees(): Promise<number> {
    const result = await prisma.platform_fees.aggregate({
      _sum: { amount: true },
    });

    return result._sum.amount?.toNumber() || 0;
  }

  static async getPlatformFeesStats(
    start_date?: Date,
    end_date?: Date
  ): Promise<{ total: number; count: number; byDate: { date: string; amount: number }[] }> {
    const where: { created_at?: { gte?: Date; lte?: Date } } = {};
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = start_date;
      if (end_date) where.created_at.lte = end_date;
    }

    const [aggregate, fees] = await Promise.all([
      prisma.platform_fees.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.platform_fees.findMany({
        where,
        orderBy: { created_at: 'asc' },
      }),
    ]);

    const byDate: Record<string, number> = {};
    for (const fee of fees) {
      const dateStr = fee.created_at.toISOString().split('T')[0];
      if (dateStr) {
        byDate[dateStr] = (byDate[dateStr] || 0) + fee.amount.toNumber();
      }
    }

    return {
      total: aggregate._sum.amount?.toNumber() || 0,
      count: aggregate._count,
      byDate: Object.entries(byDate).map(([date, amount]) => ({ date, amount })),
    };
  }
}

export class AdminService {
  static async logAdminAction(input: {
    admin_id: string;
    action_type: string;
    target_id?: string;
    target_type?: string;
    details?: Record<string, unknown>;
  }): Promise<AdminAction> {
    const action = await prisma.admin_actions.create({
      data: {
        id: crypto.randomUUID(),
        admin_id: input.admin_id,
        action_type: input.action_type,
        target_id: input.target_id,
        target_type: input.target_type,
        details: input.details as object,
      },
    });

    return {
      id: action.id,
      admin_id: action.admin_id,
      action_type: action.action_type,
      target_id: action.target_id || undefined,
      target_type: action.target_type || undefined,
      details: action.details as Record<string, unknown> | undefined,
      created_at: action.created_at,
    };
  }

  static async getAdminActions(options?: {
    admin_id?: string;
    action_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ actions: AdminAction[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const where: { admin_id?: string; action_type?: string } = {};
    if (options?.admin_id) where.admin_id = options.admin_id;
    if (options?.action_type) where.action_type = options.action_type;

    const [actions, total] = await Promise.all([
      prisma.admin_actions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.admin_actions.count({ where }),
    ]);

    return {
      actions: actions.map((a) => ({
        id: a.id,
        admin_id: a.admin_id,
        action_type: a.action_type,
        target_id: a.target_id || undefined,
        target_type: a.target_type || undefined,
        details: a.details as Record<string, unknown> | undefined,
        created_at: a.created_at,
      })),
      total,
    };
  }
}