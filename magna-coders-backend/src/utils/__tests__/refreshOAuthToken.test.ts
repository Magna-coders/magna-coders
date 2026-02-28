import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { refreshOAuthToken, ensureValidOAuthToken } from '../refreshOAuthToken';
import { encryptToken, decryptToken } from '../encryption';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('google-auth-library');
jest.mock('../encryption');
jest.mock('../validateOAuthEnv');

const mockPrisma = {
  account: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  session: {
    deleteMany: jest.fn(),
  },
  ai_interactions: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
} as any;

// Mock PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);

const mockOAuth2Client = {
  setCredentials: jest.fn(),
  refreshAccessToken: jest.fn(),
} as any;

(OAuth2Client as jest.MockedClass<typeof OAuth2Client>).mockImplementation(() => mockOAuth2Client);

// Mock encryption functions
(encryptToken as jest.Mock).mockImplementation((token: string) => `encrypted_${token}`);
(decryptToken as jest.Mock).mockImplementation((token: string) => token.replace('encrypted_', ''));

// Mock OAuth env config
jest.mock('../validateOAuthEnv', () => ({
  getOAuthEnvConfig: jest.fn(() => ({
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
  })),
}));

describe('refreshOAuthToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token not expired', () => {
    it('should return existing token if not expired', async () => {
      const userId = 'test-user-id';
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: userId,
        provider: 'google',
        access_token: 'encrypted_valid-token',
        refresh_token: 'encrypted_refresh-token',
        expires_at: futureDate,
      });

      const result = await refreshOAuthToken(userId);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('valid-token');
      expect(result.expiresAt).toEqual(futureDate);
      expect(mockOAuth2Client.refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('Token expired - successful refresh', () => {
    it('should refresh expired token successfully', async () => {
      const userId = 'test-user-id';
      const pastDate = new Date(Date.now() - 1000); // Expired
      const newExpiryDate = Date.now() + 3600000;
      
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: userId,
        provider: 'google',
        access_token: 'encrypted_old-token',
        refresh_token: 'encrypted_refresh-token',
        expires_at: pastDate,
      });

      mockOAuth2Client.refreshAccessToken.mockResolvedValue({
        credentials: {
          access_token: 'new-access-token',
          expiry_date: newExpiryDate,
        },
      });

      mockPrisma.account.update.mockResolvedValue({});
      mockPrisma.ai_interactions.create.mockResolvedValue({});

      const result = await refreshOAuthToken(userId);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
        refresh_token: 'refresh-token',
      });
      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: { id: 'account-id' },
        data: expect.objectContaining({
          access_token: 'encrypted_new-access-token',
          expires_at: new Date(newExpiryDate),
        }),
      });
      expect(mockPrisma.ai_interactions.create).toHaveBeenCalled();
    });

    it('should update refresh token if new one provided', async () => {
      const userId = 'test-user-id';
      const pastDate = new Date(Date.now() - 1000);
      
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: userId,
        provider: 'google',
        access_token: 'encrypted_old-token',
        refresh_token: 'encrypted_old-refresh',
        expires_at: pastDate,
      });

      mockOAuth2Client.refreshAccessToken.mockResolvedValue({
        credentials: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expiry_date: Date.now() + 3600000,
        },
      });

      mockPrisma.account.update.mockResolvedValue({});
      mockPrisma.ai_interactions.create.mockResolvedValue({});

      await refreshOAuthToken(userId);

      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: { id: 'account-id' },
        data: expect.objectContaining({
          refresh_token: 'encrypted_new-refresh-token',
        }),
      });
    });
  });

  describe('Error handling', () => {
    it('should return error if no OAuth account found', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);

      const result = await refreshOAuthToken('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No OAuth account found for user');
    });

    it('should return error if no refresh token available', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: 'test-user-id',
        provider: 'google',
        access_token: 'encrypted_token',
        refresh_token: null,
        expires_at: new Date(Date.now() - 1000),
      });

      const result = await refreshOAuthToken('test-user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No refresh token available');
    });

    it('should terminate session on invalid refresh token (decryption failure)', async () => {
      const userId = 'test-user-id';
      
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: userId,
        provider: 'google',
        access_token: 'encrypted_token',
        refresh_token: 'invalid-encrypted-token',
        expires_at: new Date(Date.now() - 1000),
      });

      (decryptToken as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

      const result = await refreshOAuthToken(userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid refresh token - session terminated');
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
    });

    it('should terminate session on invalid_grant error from Google', async () => {
      const userId = 'test-user-id';
      
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: userId,
        provider: 'google',
        access_token: 'encrypted_token',
        refresh_token: 'encrypted_refresh',
        expires_at: new Date(Date.now() - 1000),
      });

      (decryptToken as jest.Mock).mockImplementation((token: string) => 
        token.replace('encrypted_', '')
      );

      mockOAuth2Client.refreshAccessToken.mockRejectedValue({
        code: 400,
        message: 'invalid_grant',
      });

      mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

      const result = await refreshOAuthToken(userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Refresh token expired or invalid - session terminated');
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
    });

    it('should handle Google API errors gracefully', async () => {
      const userId = 'test-user-id';
      
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: userId,
        provider: 'google',
        access_token: 'encrypted_token',
        refresh_token: 'encrypted_refresh',
        expires_at: new Date(Date.now() - 1000),
      });

      (decryptToken as jest.Mock).mockImplementation((token: string) => 
        token.replace('encrypted_', '')
      );

      mockOAuth2Client.refreshAccessToken.mockRejectedValue({
        code: 500,
        message: 'Internal server error',
      });

      const result = await refreshOAuthToken(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to refresh token from Google');
      expect(mockPrisma.session.deleteMany).not.toHaveBeenCalled();
    });

    it('should handle missing access token in response', async () => {
      const userId = 'test-user-id';
      
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: userId,
        provider: 'google',
        access_token: 'encrypted_token',
        refresh_token: 'encrypted_refresh',
        expires_at: new Date(Date.now() - 1000),
      });

      (decryptToken as jest.Mock).mockImplementation((token: string) => 
        token.replace('encrypted_', '')
      );

      mockOAuth2Client.refreshAccessToken.mockResolvedValue({
        credentials: {
          // No access_token
          expiry_date: Date.now() + 3600000,
        },
      });

      const result = await refreshOAuthToken(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No access token received from Google');
    });

    it('should not fail if audit logging fails', async () => {
      const userId = 'test-user-id';
      const pastDate = new Date(Date.now() - 1000);
      
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: userId,
        provider: 'google',
        access_token: 'encrypted_old-token',
        refresh_token: 'encrypted_refresh-token',
        expires_at: pastDate,
      });

      mockOAuth2Client.refreshAccessToken.mockResolvedValue({
        credentials: {
          access_token: 'new-access-token',
          expiry_date: Date.now() + 3600000,
        },
      });

      mockPrisma.account.update.mockResolvedValue({});
      mockPrisma.ai_interactions.create.mockRejectedValue(new Error('Logging failed'));

      const result = await refreshOAuthToken(userId);

      // Should still succeed even if logging fails
      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
    });
  });

  describe('ensureValidOAuthToken', () => {
    it('should return true if token is valid or refreshed successfully', async () => {
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-id',
        user_id: 'test-user-id',
        provider: 'google',
        access_token: 'encrypted_valid-token',
        refresh_token: 'encrypted_refresh-token',
        expires_at: new Date(Date.now() + 3600000),
      });

      const result = await ensureValidOAuthToken('test-user-id');

      expect(result).toBe(true);
    });

    it('should return false if refresh fails', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);

      const result = await ensureValidOAuthToken('non-existent-user');

      expect(result).toBe(false);
    });
  });
});
