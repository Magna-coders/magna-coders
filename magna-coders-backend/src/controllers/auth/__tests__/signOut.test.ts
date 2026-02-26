import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { signOut } from '../oauthController';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    session: {
      deleteMany: jest.fn()
    },
    ai_interactions: {
      create: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('signOut Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let prisma: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get mocked Prisma instance
    prisma = new PrismaClient();

    // Setup mock request
    mockRequest = {
      body: {},
      headers: {},
      ip: '127.0.0.1'
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  it('should delete specific session when sessionToken provided', async () => {
    const userId = 'user-123';
    const sessionToken = 'session-token-abc';

    (mockRequest as any).user = { id: userId };
    mockRequest.body = { sessionToken };

    prisma.session.deleteMany.mockResolvedValue({ count: 1 });
    prisma.ai_interactions.create.mockResolvedValue({});

    await signOut(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        session_token: sessionToken
      }
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Signed out successfully'
    });
  });

  it('should delete session when sessionToken in headers', async () => {
    const userId = 'user-456';
    const sessionToken = 'header-session-token';

    (mockRequest as any).user = { id: userId };
    mockRequest.headers = { 'x-session-token': sessionToken };

    prisma.session.deleteMany.mockResolvedValue({ count: 1 });
    prisma.ai_interactions.create.mockResolvedValue({});

    await signOut(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        session_token: sessionToken
      }
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it('should delete all sessions when no sessionToken provided', async () => {
    const userId = 'user-789';

    (mockRequest as any).user = { id: userId };

    prisma.session.deleteMany.mockResolvedValue({ count: 3 });
    prisma.ai_interactions.create.mockResolvedValue({});

    await signOut(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        user_id: userId
      }
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Signed out successfully'
    });
  });

  it('should return 401 when user not authenticated', async () => {
    await signOut(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication required'
    });

    expect(prisma.session.deleteMany).not.toHaveBeenCalled();
  });

  it('should log sign-out event', async () => {
    const userId = 'user-log-test';
    const sessionToken = 'log-session-token';

    (mockRequest as any).user = { id: userId };
    mockRequest.body = { sessionToken };
    mockRequest.headers = { 'user-agent': 'Test Browser' };

    prisma.session.deleteMany.mockResolvedValue({ count: 1 });
    prisma.ai_interactions.create.mockResolvedValue({});

    await signOut(mockRequest as Request, mockResponse as Response);

    expect(prisma.ai_interactions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: userId,
        session_id: sessionToken,
        query_summary: 'User sign-out',
        response_summary: 'Success',
        ip_address: '127.0.0.1',
        user_agent: 'Test Browser'
      })
    });
  });

  it('should continue even if logging fails', async () => {
    const userId = 'user-log-fail';

    (mockRequest as any).user = { id: userId };

    prisma.session.deleteMany.mockResolvedValue({ count: 1 });
    prisma.ai_interactions.create.mockRejectedValue(new Error('Logging failed'));

    await signOut(mockRequest as Request, mockResponse as Response);

    // Should still return success even if logging fails
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Signed out successfully'
    });
  });

  it('should return 500 on database error', async () => {
    const userId = 'user-error';

    (mockRequest as any).user = { id: userId };

    prisma.session.deleteMany.mockRejectedValue(new Error('Database error'));

    await signOut(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to sign out'
    });
  });

  it('should handle missing user-agent gracefully', async () => {
    const userId = 'user-no-agent';

    (mockRequest as any).user = { id: userId };
    mockRequest.headers = {};

    prisma.session.deleteMany.mockResolvedValue({ count: 1 });
    prisma.ai_interactions.create.mockResolvedValue({});

    await signOut(mockRequest as Request, mockResponse as Response);

    expect(prisma.ai_interactions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_agent: 'unknown'
      })
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
