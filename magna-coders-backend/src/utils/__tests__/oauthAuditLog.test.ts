import { PrismaClient } from '@prisma/client';
import {
  OAuthEventType,
  logAuthenticationSuccess,
  logAuthenticationFailure,
  logTokenRefreshSuccess,
  logTokenRefreshFailure,
  logAccountLinkingSuccess,
  logAccountLinkingFailure,
  logRateLimitViolation,
  logCsrfValidationFailure,
  logTokenValidationFailure,
  logSessionTermination,
  logSignOut
} from '../oauthAuditLog';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockCreate = jest.fn().mockResolvedValue({});
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      ai_interactions: {
        create: mockCreate
      }
    }))
  };
});

describe('OAuth Audit Logging', () => {
  let prisma: PrismaClient;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    mockCreate = (prisma.ai_interactions.create as jest.Mock);
  });

  describe('logAuthenticationSuccess', () => {
    it('should log successful authentication for new user', async () => {
      await logAuthenticationSuccess(
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0',
        true,
        'test@example.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-123',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          query_summary: OAuthEventType.AUTHENTICATION_SUCCESS,
          response_summary: expect.stringContaining('New user account created')
        })
      });
    });

    it('should log successful authentication for existing user', async () => {
      await logAuthenticationSuccess(
        'user-456',
        '192.168.1.2',
        'Chrome/90.0',
        false,
        'existing@example.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-456',
          query_summary: OAuthEventType.AUTHENTICATION_SUCCESS,
          response_summary: expect.stringContaining('Existing user authenticated')
        })
      });
    });

    it('should include email in response summary', async () => {
      await logAuthenticationSuccess(
        'user-789',
        '10.0.0.1',
        'Safari/14.0',
        true,
        'email@test.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          response_summary: expect.stringContaining('email@test.com')
        })
      });
    });
  });

  describe('logAuthenticationFailure', () => {
    it('should log authentication failure with reason', async () => {
      await logAuthenticationFailure(
        '192.168.1.1',
        'Mozilla/5.0',
        'Invalid token signature',
        'test@example.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'anonymous',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          query_summary: OAuthEventType.AUTHENTICATION_FAILURE,
          response_summary: expect.stringContaining('Invalid token signature')
        })
      });
    });

    it('should handle missing email', async () => {
      await logAuthenticationFailure(
        '192.168.1.1',
        'Mozilla/5.0',
        'Token expired'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          query_summary: OAuthEventType.AUTHENTICATION_FAILURE,
          response_summary: expect.stringContaining('Token expired')
        })
      });
    });
  });

  describe('logTokenRefreshSuccess', () => {
    it('should log successful token refresh', async () => {
      await logTokenRefreshSuccess('user-123');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-123',
          ip_address: 'system',
          user_agent: 'token-refresh-utility',
          query_summary: OAuthEventType.TOKEN_REFRESH_SUCCESS,
          response_summary: expect.stringContaining('Access token refreshed successfully')
        })
      });
    });
  });

  describe('logTokenRefreshFailure', () => {
    it('should log token refresh failure with reason', async () => {
      await logTokenRefreshFailure('user-456', 'Invalid refresh token');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-456',
          query_summary: OAuthEventType.TOKEN_REFRESH_FAILURE,
          response_summary: expect.stringContaining('Invalid refresh token')
        })
      });
    });
  });

  describe('logAccountLinkingSuccess', () => {
    it('should log successful account linking', async () => {
      await logAccountLinkingSuccess(
        'user-789',
        '192.168.1.3',
        'Firefox/88.0',
        'link@example.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-789',
          ip_address: '192.168.1.3',
          user_agent: 'Firefox/88.0',
          query_summary: OAuthEventType.ACCOUNT_LINKING_SUCCESS,
          response_summary: expect.stringContaining('Google account linked successfully')
        })
      });
    });
  });

  describe('logAccountLinkingFailure', () => {
    it('should log account linking failure', async () => {
      await logAccountLinkingFailure(
        'user-101',
        '192.168.1.4',
        'Edge/90.0',
        'Email mismatch',
        'wrong@example.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-101',
          query_summary: OAuthEventType.ACCOUNT_LINKING_FAILURE,
          response_summary: expect.stringContaining('Email mismatch')
        })
      });
    });
  });

  describe('logRateLimitViolation', () => {
    it('should log rate limit violation', async () => {
      await logRateLimitViolation(
        '192.168.1.5',
        'Bot/1.0',
        '/api/auth/oauth/callback'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip_address: '192.168.1.5',
          user_agent: 'Bot/1.0',
          query_summary: OAuthEventType.RATE_LIMIT_VIOLATION,
          response_summary: expect.stringContaining('/api/auth/oauth/callback')
        })
      });
    });
  });

  describe('logCsrfValidationFailure', () => {
    it('should log CSRF validation failure', async () => {
      await logCsrfValidationFailure(
        '192.168.1.6',
        'Attacker/1.0',
        'State parameter mismatch'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip_address: '192.168.1.6',
          query_summary: OAuthEventType.CSRF_VALIDATION_FAILURE,
          response_summary: expect.stringContaining('State parameter mismatch')
        })
      });
    });
  });

  describe('logTokenValidationFailure', () => {
    it('should log token validation failure', async () => {
      await logTokenValidationFailure(
        '192.168.1.7',
        'Chrome/91.0',
        'Invalid audience claim',
        'test@example.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip_address: '192.168.1.7',
          query_summary: OAuthEventType.TOKEN_VALIDATION_FAILURE,
          response_summary: expect.stringContaining('Invalid audience claim')
        })
      });
    });
  });

  describe('logSessionTermination', () => {
    it('should log session termination', async () => {
      await logSessionTermination(
        'user-202',
        'Invalid refresh token',
        3
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-202',
          ip_address: 'system',
          user_agent: 'session-manager',
          query_summary: OAuthEventType.SESSION_TERMINATION,
          response_summary: expect.stringContaining('3 session(s) terminated')
        })
      });
    });
  });

  describe('logSignOut', () => {
    it('should log sign out with session token', async () => {
      await logSignOut(
        'user-303',
        '192.168.1.8',
        'Safari/15.0',
        'session-token-123'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-303',
          session_id: 'session-token-123',
          ip_address: '192.168.1.8',
          query_summary: OAuthEventType.SIGN_OUT
        })
      });
    });

    it('should log sign out without session token', async () => {
      await logSignOut(
        'user-404',
        '192.168.1.9',
        'Firefox/89.0'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-404',
          session_id: 'all-sessions',
          query_summary: OAuthEventType.SIGN_OUT
        })
      });
    });
  });

  describe('Error handling', () => {
    it('should not throw when logging fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        logAuthenticationSuccess(
          'user-500',
          '192.168.1.10',
          'Chrome/92.0',
          true,
          'test@example.com'
        )
      ).resolves.not.toThrow();
    });

    it('should log error to console when logging fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCreate.mockRejectedValueOnce(new Error('Database connection lost'));

      await logTokenRefreshSuccess('user-600');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OAuth Audit Log]'),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Required fields', () => {
    it('should include timestamp in all logs', async () => {
      await logAuthenticationSuccess(
        'user-700',
        '192.168.1.11',
        'Chrome/93.0',
        true,
        'test@example.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          created_at: expect.any(Date)
        })
      });
    });

    it('should include outcome in response summary', async () => {
      await logAuthenticationSuccess(
        'user-800',
        '192.168.1.12',
        'Safari/16.0',
        false,
        'test@example.com'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          response_summary: expect.stringContaining('Outcome: success')
        })
      });
    });

    it('should handle unknown IP and user agent', async () => {
      await logAuthenticationFailure(
        'unknown',
        'unknown',
        'Test failure'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip_address: 'unknown',
          user_agent: 'unknown'
        })
      });
    });
  });
});
