import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Rate limiter for AI API endpoints
 * Implements tier-based limits:
 * - Free: 20 requests/minute
 * - Premium: 60 requests/minute
 * - Pro: 120 requests/minute
 * - Backend-wide: 100 requests/minute from AI backend
 */

// Store for tracking backend-wide rate limit
const backendRequestStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get user's subscription tier
 * TODO: Integrate with actual subscription system once implemented
 * For now, returns 'free' as default
 */
async function getUserTier(userId: string): Promise<'free' | 'premium' | 'pro'> {
  try {
    // TODO: Query user_roles or subscription table to get actual tier
    // For now, return 'free' as default
    // Example future implementation:
    // const user = await prisma.users.findUnique({
    //   where: { id: userId },
    //   select: { subscription_tier: true }
    // });
    // return user?.subscription_tier || 'free';
    
    return 'free';
  } catch (error) {
    console.error('[Rate Limiter] Error fetching user tier:', error);
    return 'free';
  }
}

/**
 * Check backend-wide rate limit (100 requests/minute)
 */
function checkBackendLimit(ip: string): boolean {
  const now = Date.now();
  const key = `backend:${ip}`;
  const record = backendRequestStore.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    backendRequestStore.set(key, {
      count: 1,
      resetTime: now + 60000 // 1 minute from now
    });
    return true;
  }

  if (record.count >= 100) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Tier-based rate limiter middleware
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  
  // Dynamic max based on user tier
  max: async (req: Request) => {
    const userId = req.user;
    
    if (!userId) {
      // No authenticated user, use free tier limit
      return 20;
    }

    const tier = await getUserTier(userId);
    
    const limits = {
      free: 20,
      premium: 60,
      pro: 120
    };

    return limits[tier];
  },

  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    const retryAfter = Math.ceil(60); // 60 seconds
    
    res.status(429)
      .set('Retry-After', retryAfter.toString())
      .json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: retryAfter
      });
  },

  // Skip failed requests (don't count them against the limit)
  skipFailedRequests: false,

  // Skip successful requests (count all requests)
  skipSuccessfulRequests: false,

  // Standard headers
  standardHeaders: true,
  legacyHeaders: false,

  // Store in memory (for production, consider Redis)
  // TODO: Use Redis for distributed rate limiting in production
  store: undefined // Uses default memory store
});

/**
 * Backend-wide rate limiter (100 requests/minute from AI backend)
 * This is applied in addition to per-user rate limits
 */
export const backendRateLimiter = (
  req: Request,
  res: Response,
  next: Function
): void => {
  const ip = req.ip || 'unknown';
  
  if (!checkBackendLimit(ip)) {
    const retryAfter = 60;
    
    console.warn(`[Rate Limiter] Backend limit exceeded from IP: ${ip}`);
    
    res.status(429)
      .set('Retry-After', retryAfter.toString())
      .json({
        success: false,
        error: 'Too Many Requests',
        message: 'Backend rate limit exceeded. Please try again later.',
        retryAfter: retryAfter
      });
    return;
  }

  next();
};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(backendRequestStore.entries());
  for (const [key, record] of entries) {
    if (now > record.resetTime) {
      backendRequestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
