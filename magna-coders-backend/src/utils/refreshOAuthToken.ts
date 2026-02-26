import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { encryptToken, decryptToken } from './encryption';
import { getOAuthEnvConfig } from './validateOAuthEnv';
import {
  logTokenRefreshSuccess,
  logTokenRefreshFailure,
  logSessionTermination
} from './oauthAuditLog';

const prisma = new PrismaClient();

/**
 * OAuth Token Refresh Utility
 * 
 * Automatically refreshes expired OAuth access tokens using refresh tokens.
 * This ensures users maintain uninterrupted access without re-authentication.
 * 
 * Requirements:
 * - Requirement 4.2: Key derivation from JWT_SECRET
 * - Requirement 4.3: Token refresh on expiration
 * - Requirement 4.4: Invalid refresh token handling
 * - Requirement 4.5: Update stored tokens
 * - Requirement 4.6: Audit logging
 */

interface RefreshTokenResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Refreshes an expired OAuth access token using the refresh token
 * 
 * @param {string} userId - The user ID whose token needs refreshing
 * @returns {Promise<RefreshTokenResult>} Result object with new token or error
 * 
 * Flow:
 * 1. Retrieve user's OAuth account from database
 * 2. Check if access_token is expired
 * 3. Decrypt refresh_token
 * 4. Request new tokens from Google OAuth
 * 5. Encrypt and update access_token in database
 * 6. Update expires_at timestamp
 * 7. Log token refresh event
 * 8. Handle invalid refresh_token (terminate session)
 * 
 * @example
 * const result = await refreshOAuthToken('user-uuid');
 * if (result.success) {
 *   console.log('Token refreshed:', result.accessToken);
 * } else {
 *   console.error('Refresh failed:', result.error);
 * }
 */
export async function refreshOAuthToken(userId: string): Promise<RefreshTokenResult> {
  // Validate input
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId provided to refreshOAuthToken:', { userId });
    return {
      success: false,
      error: 'Invalid user ID'
    };
  }

  try {
    // Retrieve OAuth account for user (Requirement 4.3)
    let account;
    try {
      account = await prisma.account.findFirst({
        where: {
          user_id: userId,
          provider: 'google'
        }
      });
    } catch (error: any) {
      console.error('Database error retrieving OAuth account:', {
        userId,
        error: error.message,
        code: error.code
      });
      
      return {
        success: false,
        error: 'Failed to retrieve account information'
      };
    }
    
    if (!account) {
      console.warn('No OAuth account found for user:', { userId });
      return {
        success: false,
        error: 'No OAuth account found for user'
      };
    }
    
    // Check if access_token is expired (Requirement 4.3)
    const now = new Date();
    const isExpired = account.expires_at && account.expires_at <= now;
    
    if (!isExpired) {
      // Token is still valid, no refresh needed
      try {
        const decryptedToken = account.access_token ? decryptToken(account.access_token) : undefined;
        return {
          success: true,
          accessToken: decryptedToken,
          expiresAt: account.expires_at || undefined
        };
      } catch (error: any) {
        console.error('Failed to decrypt valid access token:', {
          userId,
          error: error.message
        });
        
        // Token is corrupted, need to refresh
        // Continue with refresh flow
      }
    }
    
    // Check if refresh_token exists
    if (!account.refresh_token) {
      console.warn('No refresh token available for user:', { userId });
      
      // Terminate session since we can't refresh
      await terminateUserSession(userId);
      
      return {
        success: false,
        error: 'No refresh token available - session terminated'
      };
    }
    
    // Decrypt refresh_token before use (Requirement 4.3)
    let decryptedRefreshToken: string;
    try {
      decryptedRefreshToken = decryptToken(account.refresh_token);
    } catch (error: any) {
      console.error('Failed to decrypt refresh token:', {
        userId,
        error: error.message,
        type: error.constructor.name
      });
      
      // Invalid refresh token - terminate session (Requirement 4.4)
      await terminateUserSession(userId);
      
      return {
        success: false,
        error: 'Invalid refresh token - session terminated'
      };
    }
    
    // Get OAuth configuration with error handling
    let oauthConfig;
    try {
      oauthConfig = getOAuthEnvConfig();
    } catch (error: any) {
      console.error('OAuth configuration error during token refresh:', {
        userId,
        error: error.message
      });
      
      return {
        success: false,
        error: 'OAuth service configuration error'
      };
    }
    
    const googleClient = new OAuth2Client(
      oauthConfig.GOOGLE_CLIENT_ID,
      oauthConfig.GOOGLE_CLIENT_SECRET
    );
    
    // Set refresh token
    googleClient.setCredentials({
      refresh_token: decryptedRefreshToken
    });
    
    // Request new tokens from Google with retry logic (Requirement 4.3)
    let newTokens;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        const response = await googleClient.refreshAccessToken();
        newTokens = response.credentials;
        break; // Success, exit retry loop
      } catch (error: any) {
        retryCount++;
        
        // Check if refresh token is invalid or expired (Requirement 4.4)
        if (error.code === 400 || error.message?.includes('invalid_grant')) {
          console.error('Invalid or expired refresh token:', {
            userId,
            error: error.message,
            code: error.code
          });
          
          // Invalid refresh token - terminate session
          await terminateUserSession(userId);
          
          return {
            success: false,
            error: 'Refresh token expired or invalid - session terminated'
          };
        }
        
        // Network or temporary errors - retry
        if (retryCount <= maxRetries && (
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          error.message?.includes('network') ||
          error.message?.includes('timeout')
        )) {
          console.warn(`Token refresh attempt ${retryCount} failed, retrying...`, {
            userId,
            error: error.message,
            code: error.code
          });
          
          // Exponential backoff: 1s, 2s
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        // Other errors - don't retry
        console.error('Failed to refresh OAuth token:', {
          userId,
          error: error.message,
          code: error.code,
          type: error.constructor.name,
          retryCount
        });
        
        return {
          success: false,
          error: 'Failed to refresh token from Google'
        };
      }
    }
    
    // Validate new tokens received
    if (!newTokens || !newTokens.access_token) {
      console.error('No access token received from Google:', {
        userId,
        hasTokens: !!newTokens
      });
      
      return {
        success: false,
        error: 'No access token received from Google'
      };
    }
    
    // Calculate expiration timestamp
    const expiresAt = newTokens.expiry_date 
      ? new Date(newTokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour
    
    // Encrypt new tokens with error handling
    let encryptedAccessToken: string;
    let encryptedRefreshToken: string | null = null;
    
    try {
      encryptedAccessToken = encryptToken(newTokens.access_token);
      if (newTokens.refresh_token) {
        encryptedRefreshToken = encryptToken(newTokens.refresh_token);
      }
    } catch (error: any) {
      console.error('Failed to encrypt refreshed tokens:', {
        userId,
        error: error.message
      });
      
      return {
        success: false,
        error: 'Failed to secure refreshed tokens'
      };
    }
    
    // Update access_token in database (Requirement 4.5)
    try {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: encryptedAccessToken,
          // Update refresh_token if a new one was provided
          refresh_token: encryptedRefreshToken || account.refresh_token,
          expires_at: expiresAt, // Update expires_at timestamp (Requirement 4.5)
          updated_at: new Date()
        }
      });
    } catch (error: any) {
      console.error('Database error updating refreshed tokens:', {
        userId,
        accountId: account.id,
        error: error.message,
        code: error.code
      });
      
      return {
        success: false,
        error: 'Failed to save refreshed tokens'
      };
    }
    
    // Log token refresh event (Requirement 4.6)
    await logTokenRefreshSuccess(userId);
    
    return {
      success: true,
      accessToken: newTokens.access_token,
      expiresAt
    };
    
  } catch (error: any) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in refreshOAuthToken:', {
      userId,
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    // Log token refresh failure
    await logTokenRefreshFailure(userId, error.message || 'Unexpected error');
    
    return {
      success: false,
      error: 'Unexpected error during token refresh'
    };
  }
}

/**
 * Terminates all sessions for a user when refresh token is invalid
 * 
 * @param {string} userId - The user ID whose sessions should be terminated
 * 
 * This is called when a refresh token is expired or invalid, requiring
 * the user to re-authenticate (Requirement 4.4)
 */
async function terminateUserSession(userId: string): Promise<void> {
  try {
    // Delete all sessions for the user
    const result = await prisma.session.deleteMany({
      where: { user_id: userId }
    });
    
    console.log('Terminated sessions for user due to invalid refresh token:', {
      userId,
      sessionsDeleted: result.count
    });
    
    // Log session termination
    await logSessionTermination(
      userId,
      'Invalid or expired refresh token',
      result.count
    );
  } catch (error: any) {
    console.error('Failed to terminate user sessions:', {
      userId,
      error: error.message,
      code: error.code,
      type: error.constructor.name
    });
  }
}

/**
 * Checks if a user's OAuth token needs refreshing and refreshes if necessary
 * 
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} True if token is valid (refreshed or not expired), false otherwise
 * 
 * This is a convenience function that can be called before making API requests
 * that require a valid OAuth token.
 * 
 * @example
 * if (await ensureValidOAuthToken(userId)) {
 *   // Proceed with API request
 * } else {
 *   // Redirect to login
 * }
 */
export async function ensureValidOAuthToken(userId: string): Promise<boolean> {
  const result = await refreshOAuthToken(userId);
  return result.success;
}
