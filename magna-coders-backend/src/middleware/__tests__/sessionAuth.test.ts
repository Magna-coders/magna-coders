import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateSession, refreshSessionExpiration } from '../sessionAuth';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    session: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn()
    },
    users: {
      findUnique: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('Session Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let prisma: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get mocked Prisma instance
    prisma = new PrismaClient();

    // Setup mock request
    mockRequest = {
      headers: {},
      cookies: {},
      body: {}
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Setup mock next
    mockNext = jest.fn();
  });

  describe('validateSession', () => {
    it('should validate session token from Authorization header', async () => {
      const sessionToken = 'valid-session-token';
      const userId = 'user-123';
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      mockRequest.headers = {
        authorization: `Bearer ${sessionToken}`
      };

      // Mock session lookup
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-123',
        user_id: userId,
        expires_at: futureDate
      });

      // Mock user lookup
      prisma.users.findUnique.mockResolvedValue({
        id: userId
      });

      await validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { session_token: sessionToken },
        select: {
          id: true,
          user_id: true,
          expires_at: true
        }
      });

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true }
      });

      expect(mockRequest.user).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate session token from cookies', async () => {
      const sessionToken = 'cookie-session-token';
      const userId = 'user-456';
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockRequest.cookies = {
        session_token: sessionToken
      };

      prisma.session.findUnique.mockResolvedValue({
        id: 'session-456',
        user_id: userId,
        expires_at: futureDate
      });

      prisma.users.findUnique.mockResolvedValue({
        id: userId
      });

      await validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate session token from request body', async () => {
      const sessionToken = 'body-session-token';
      const userId = 'user-789';
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockRequest.body = {
        session_token: sessionToken
      };

      prisma.session.findUnique.mockResolvedValue({
        id: 'session-789',
        user_id: userId,
        expires_at: futureDate
      });

      prisma.users.findUnique.mockResolvedValue({
        id: userId
      });

      await validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBe(userId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no session token provided', async () => {
      await validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when session not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      prisma.session.findUnique.mockResolvedValue(null);

      await validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid session token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 and delete expired session', async () => {
      const sessionToken = 'expired-session-token';
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      mockRequest.headers = {
        authorization: `Bearer ${sessionToken}`
      };

      prisma.session.findUnique.mockResolvedValue({
        id: 'session-expired',
        user_id: 'user-123',
        expires_at: pastDate
      });

      await validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { session_token: sessionToken }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session expired. Please sign in again.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      const sessionToken = 'orphaned-session-token';
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockRequest.headers = {
        authorization: `Bearer ${sessionToken}`
      };

      prisma.session.findUnique.mockResolvedValue({
        id: 'session-orphaned',
        user_id: 'deleted-user',
        expires_at: futureDate
      });

      prisma.users.findUnique.mockResolvedValue(null);

      await validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { session_token: sessionToken }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer some-token'
      };

      prisma.session.findUnique.mockRejectedValue(new Error('Database error'));

      await validateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session validation failed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('refreshSessionExpiration', () => {
    it('should refresh session expiration', async () => {
      const sessionToken = 'refresh-token';

      mockRequest.headers = {
        authorization: `Bearer ${sessionToken}`
      };

      prisma.session.update.mockResolvedValue({});

      await refreshSessionExpiration(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { session_token: sessionToken },
        data: expect.objectContaining({
          expires_at: expect.any(Date)
        })
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue on refresh error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer some-token'
      };

      prisma.session.update.mockRejectedValue(new Error('Update failed'));

      await refreshSessionExpiration(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should still call next even on error
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing session token gracefully', async () => {
      await refreshSessionExpiration(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.session.update).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
