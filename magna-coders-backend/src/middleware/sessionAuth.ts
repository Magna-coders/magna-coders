import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: string;
    }
  }
}

/**
 * Middleware to validate session tokens for authenticated requests.
 * 
 * This middleware validates session tokens created during OAuth authentication,
 * ensuring that only users with valid, non-expired sessions can access protected routes.
 * 
 * The session_token can be provided in:
 * 1. Authorization header: "Bearer <session_token>"
 * 2. Cookie: session_token=<session_token>
 * 3. Request body: { session_token: "<session_token>" }
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract session token from multiple possible sources
    let sessionToken: string | undefined;

    // 1. Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }

    // 2. Check cookies
    if (!sessionToken && req.cookies?.session_token) {
      sessionToken = req.cookies.session_token;
    }

    // 3. Check request body
    if (!sessionToken && req.body?.session_token) {
      sessionToken = req.body.session_token;
    }

    // No session token provided
    if (!sessionToken) {
      res.status(401).json({
        success: false,
        message: 'Session token required'
      });
      return;
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { session_token: sessionToken },
      select: {
        id: true,
        user_id: true,
        expires_at: true
      }
    });

    // Session not found
    if (!session) {
      res.status(401).json({
        success: false,
        message: 'Invalid session token'
      });
      return;
    }

    // Check if session has expired
    const now = new Date();
    if (session.expires_at < now) {
      // Delete expired session
      await prisma.session.delete({
        where: { session_token: sessionToken }
      });

      res.status(401).json({
        success: false,
        message: 'Session expired. Please sign in again.'
      });
      return;
    }

    // Verify user still exists
    const user = await prisma.users.findUnique({
      where: { id: session.user_id },
      select: { id: true }
    });

    if (!user) {
      // User deleted, clean up session
      await prisma.session.delete({
        where: { session_token: sessionToken }
      });

      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Attach user_id to request object for downstream handlers
    req.user = session.user_id;

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation failed'
    });
  }
};

/**
 * Optional middleware to refresh session expiration on each request.
 * This extends the session lifetime by 30 days from the last activity.
 * 
 * Use this middleware after validateSession to implement sliding sessions.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const refreshSessionExpiration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract session token (same logic as validateSession)
    let sessionToken: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }

    if (!sessionToken && req.cookies?.session_token) {
      sessionToken = req.cookies.session_token;
    }

    if (!sessionToken && req.body?.session_token) {
      sessionToken = req.body.session_token;
    }

    if (sessionToken) {
      // Update session expiration to 30 days from now
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);

      await prisma.session.update({
        where: { session_token: sessionToken },
        data: { expires_at: newExpiresAt }
      });
    }

    next();
  } catch (error) {
    // Don't fail the request if refresh fails, just log it
    console.error('Session refresh error:', error);
    next();
  }
};
