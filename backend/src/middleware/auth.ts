import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { SECRET } from '../utils/config';
import { prisma, db } from '../utils/prismaClient';

interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: string;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, SECRET);
    if (typeof decoded === 'string' || !decoded.id) {
      throw new Error('Invalid token payload');
    }

    // Check if user exists
    const user = await db.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, isVerified: true, role: true }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Attach user ID to request
    req.user = decoded.id;

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
        return;
      }

      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Token expired'
        });
        return;
      }
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // This would need user data to be fetched
    // For now, just pass through
    next();
  };
};

export const requireVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await db.users.findUnique({
      where: { id: userId },
      select: { isVerified: true }
    } as any);

    if (!user?.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Account verification required'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification check failed'
    });
  }
};