import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { SECRET } from '../utils/config';

const prisma = new PrismaClient();

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: string;
    }
  }
}

interface JwtPayload {
  sub?: string;
  id?: string;
  user_id?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate AI backend requests using API key and JWT token
 * Validates X-API-Key header against environment variable
 * Decodes JWT token from Authorization header to extract user ID
 * Returns 401 for invalid/missing API keys and logs attempts
 */
export const authenticateAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const expectedApiKey = process.env.AI_API_KEY;
    const authHeader = req.headers.authorization;

    // Log authentication attempt
    console.log('[AI Auth] Authentication attempt from:', req.ip);

    // Step 1: Validate API key
    if (!apiKey) {
      console.warn('[AI Auth] Missing API key from:', req.ip);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'API key required'
      });
      return;
    }

    if (!expectedApiKey) {
      console.error('[AI Auth] AI_API_KEY not configured in environment');
      res.status(500).json({
        success: false,
        error: 'Configuration Error',
        message: 'Server configuration error'
      });
      return;
    }

    if (apiKey !== expectedApiKey) {
      console.warn('[AI Auth] Invalid API key attempt from:', req.ip);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
      return;
    }

    console.log('[AI Auth] API key validated successfully');

    // Step 2: Extract and decode JWT token to get user ID
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.warn('[AI Auth] Missing JWT token from:', req.ip);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'JWT token required'
      });
      return;
    }

    try {
      // Verify and decode JWT token
      const decoded = jwt.verify(token, SECRET) as JwtPayload;

      // Support 'sub' (standard), 'id', and 'user_id' for backward compatibility
      const userId = decoded.sub || decoded.id || decoded.user_id;

      if (!userId) {
        console.warn('[AI Auth] JWT token missing user ID from:', req.ip);
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token format'
        });
        return;
      }

      // Attach user ID to request for downstream middleware
      req.user = userId;

      console.log('[AI Auth] JWT token validated successfully for user:', userId);
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        console.warn('[AI Auth] Invalid JWT token from:', req.ip, jwtError.message);
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid JWT token'
        });
        return;
      }

      if (jwtError instanceof jwt.TokenExpiredError) {
        console.warn('[AI Auth] Expired JWT token from:', req.ip);
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'JWT token expired'
        });
        return;
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('[AI Auth] Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to authorize user data access
 * Validates requested user ID matches authenticated user
 * Returns 403 for mismatched user IDs and creates audit logs
 */
export const authorizeUserData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.user; // From JWT validation

    if (!authenticatedUserId) {
      console.warn('[AI Auth] No authenticated user in request');
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!requestedUserId) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User ID required'
      });
      return;
    }

    if (requestedUserId !== authenticatedUserId) {
      // Create audit log for unauthorized access attempt
      try {
        await prisma.ai_interactions.create({
          data: {
            user_id: authenticatedUserId,
            session_id: 'unauthorized_attempt',
            query_summary: `Unauthorized access attempt to user ${requestedUserId}`,
            tools_used: { event: 'unauthorized_access_attempt' },
            response_summary: 'Access denied',
            ip_address: req.ip || null,
            user_agent: req.headers['user-agent'] || null
          }
        });
      } catch (logError) {
        console.error('[AI Auth] Failed to create audit log:', logError);
      }

      console.warn(
        `[AI Auth] Unauthorized access attempt: user ${authenticatedUserId} tried to access user ${requestedUserId}`
      );

      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied to requested resource'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[AI Auth] Authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authorization error'
    });
  }
};

/**
 * Middleware to filter sensitive data from responses
 * Removes sensitive fields: password, email, apiKey, token, paymentInfo
 * Handles nested objects and arrays recursively
 */
export const filterSensitiveData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalJson = res.json.bind(res);

  res.json = function (data: any): Response {
    const filtered = removeSensitiveFields(data);
    return originalJson(filtered);
  };

  next();
};

/**
 * Recursively removes sensitive fields from objects and arrays
 */
function removeSensitiveFields(data: any): any {
  const sensitiveFields = [
    'password',
    'password_hash',
    'passwordHash',
    'email',
    'apiKey',
    'api_key',
    'token',
    'accessToken',
    'refreshToken',
    'paymentInfo',
    'payment_info',
    'cardNumber',
    'cvv',
    'ssn',
    'taxId'
  ];

  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => removeSensitiveFields(item));
  }

  if (typeof data === 'object') {
    const filtered: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field =>
          lowerKey.includes(field.toLowerCase())
        );

        if (!isSensitive) {
          filtered[key] = removeSensitiveFields(data[key]);
        }
      }
    }
    return filtered;
  }

  return data;
}
