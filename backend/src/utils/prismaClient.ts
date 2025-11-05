import { PrismaClient } from '@prisma/client';

const _prisma = new PrismaClient();
export const prisma: any = _prisma as any; // exported as any to avoid delegate naming/type mismatches during incremental fixes
export const db: any = _prisma as any;
