import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logRateLimitViolation } from '../utils/oauthAuditLog';

/**
 * Rate limiter for OAuth endpoints
 * Prevents abuse of OAuth authentication flows
 * Limit: 5 requests per 15 minutes per IP address
 * 
 * Applied to:
 * - POST /api/auth/oauth/callback
 * - POST /api/auth/oauth/link
 */
export const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per IP
  
  // Custom handler for rate limit exceeded
  handler: async (req: Request, res: Response) => {
    const retryAfter = Math.ceil(15 * 60); // 15 minutes in seconds
    
    console.warn(`[OAuth Rate Limiter] Limit exceeded from IP: ${req.ip}`);
    
    // Log rate limit violation
    await logRateLimitViolation(
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
      req.path
    );
    
    res.status(429)
      .set('Retry-After', retryAfter.toString())
      .json({
        success: false,
        error: 'Too Many Requests',
        message: 'Too many authentication attempts. Please try again later.',
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

  // Use IP address for rate limiting
  keyGenerator: (req: Request) => req.ip || 'unknown'
});
