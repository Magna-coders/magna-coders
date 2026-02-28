import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: string; // User ID from JWT
    }
  }
}