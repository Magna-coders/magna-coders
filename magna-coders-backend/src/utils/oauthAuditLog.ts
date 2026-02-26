import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * OAuth Audit Logging Utility
 * 
 * Centralized logging for all OAuth-related events to ensure comprehensive
 * security monitoring and compliance with audit requirements.
 * 
 * Requirements:
 * - Requirement 6.9: Log all OAuth authentication attempts with details
 * - Requirement 4.6: Log token refresh operations
 * - Task 15.2: Comprehensive audit logging
 * 
 * All logs include:
 * - timestamp (created_at)
 * - user_id (when available)
 * - IP address
 * - user_agent
 * - outcome (success/failure)
 * - event-specific details
 */

export enum OAuthEventType {
  AUTHENTICATION_SUCCESS = 'oauth_authentication_success',
  AUTHENTICATION_FAILURE = 'oauth_authentication_failure',
  TOKEN_REFRESH_SUCCESS = 'oauth_token_refresh_success',
  TOKEN_REFRESH_FAILURE = 'oauth_token_refresh_failure',
  ACCOUNT_LINKING_SUCCESS = 'oauth_account_linking_success',
  ACCOUNT_LINKING_FAILURE = 'oauth_account_linking_failure',
  RATE_LIMIT_VIOLATION = 'oauth_rate_limit_violation',
  CSRF_VALIDATION_FAILURE = 'oauth_csrf_validation_failure',
  TOKEN_VALIDATION_FAILURE = 'oauth_token_validation_failure',
  SESSION_TERMINATION = 'oauth_session_termination',
  SIGN_OUT = 'oauth_sign_out'
}

interface AuditLogParams {
  eventType: OAuthEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: 'success' | 'failure';
  details?: string;
  errorMessage?: string;
  email?: string;
}

/**
 * Logs an OAuth-related event to the audit log
 * 
 * @param params - Audit log parameters
 * @returns Promise<void>
 * 
 * @example
 * await logOAuthEvent({
 *   eventType: OAuthEventType.AUTHENTICATION_SUCCESS,
 *   userId: 'user-123',
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 *   outcome: 'success',
 *   details: 'New user account created'
 * });
 */
export async function logOAuthEvent(params: AuditLogParams): Promise<void> {
  try {
    // Build query summary with event type and outcome
    const querySummary = `${params.eventType}`;
    
    // Build response summary with details
    let responseSummary = `Outcome: ${params.outcome}`;
    if (params.details) {
      responseSummary += ` | ${params.details}`;
    }
    if (params.errorMessage) {
      responseSummary += ` | Error: ${params.errorMessage}`;
    }
    if (params.email) {
      responseSummary += ` | Email: ${params.email}`;
    }
    
    // Create audit log entry
    await prisma.ai_interactions.create({
      data: {
        id: crypto.randomUUID(),
        user_id: params.userId || 'anonymous',
        session_id: params.sessionId || 'oauth-event',
        query_summary: querySummary,
        response_summary: responseSummary,
        created_at: new Date(), // Timestamp
        ip_address: params.ipAddress || 'unknown',
        user_agent: params.userAgent || 'unknown'
      }
    });
  } catch (error: any) {
    // Don't throw - logging failure shouldn't break the request
    // But do log to console for monitoring
    console.error('[OAuth Audit Log] Failed to create audit log entry:', {
      eventType: params.eventType,
      userId: params.userId,
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Logs a successful OAuth authentication
 * 
 * @param userId - The authenticated user ID
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param isNewUser - Whether this is a new user registration
 * @param email - User email address
 */
export async function logAuthenticationSuccess(
  userId: string,
  ipAddress: string,
  userAgent: string,
  isNewUser: boolean,
  email: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.AUTHENTICATION_SUCCESS,
    userId,
    ipAddress,
    userAgent,
    outcome: 'success',
    details: isNewUser ? 'New user account created' : 'Existing user authenticated',
    email
  });
}

/**
 * Logs a failed OAuth authentication attempt
 * 
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param reason - Failure reason
 * @param email - User email (if available)
 */
export async function logAuthenticationFailure(
  ipAddress: string,
  userAgent: string,
  reason: string,
  email?: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.AUTHENTICATION_FAILURE,
    ipAddress,
    userAgent,
    outcome: 'failure',
    errorMessage: reason,
    email
  });
}

/**
 * Logs a successful token refresh operation
 * 
 * @param userId - The user ID whose token was refreshed
 */
export async function logTokenRefreshSuccess(userId: string): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.TOKEN_REFRESH_SUCCESS,
    userId,
    ipAddress: 'system',
    userAgent: 'token-refresh-utility',
    outcome: 'success',
    details: 'Access token refreshed successfully'
  });
}

/**
 * Logs a failed token refresh operation
 * 
 * @param userId - The user ID whose token refresh failed
 * @param reason - Failure reason
 */
export async function logTokenRefreshFailure(
  userId: string,
  reason: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.TOKEN_REFRESH_FAILURE,
    userId,
    ipAddress: 'system',
    userAgent: 'token-refresh-utility',
    outcome: 'failure',
    errorMessage: reason
  });
}

/**
 * Logs a successful account linking operation
 * 
 * @param userId - The user ID who linked their account
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param email - Google account email
 */
export async function logAccountLinkingSuccess(
  userId: string,
  ipAddress: string,
  userAgent: string,
  email: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.ACCOUNT_LINKING_SUCCESS,
    userId,
    ipAddress,
    userAgent,
    outcome: 'success',
    details: 'Google account linked successfully',
    email
  });
}

/**
 * Logs a failed account linking attempt
 * 
 * @param userId - The user ID who attempted to link
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param reason - Failure reason
 * @param email - Google account email (if available)
 */
export async function logAccountLinkingFailure(
  userId: string,
  ipAddress: string,
  userAgent: string,
  reason: string,
  email?: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.ACCOUNT_LINKING_FAILURE,
    userId,
    ipAddress,
    userAgent,
    outcome: 'failure',
    errorMessage: reason,
    email
  });
}

/**
 * Logs a rate limit violation
 * 
 * @param ipAddress - Client IP address that exceeded rate limit
 * @param userAgent - Client user agent
 * @param endpoint - The endpoint that was rate limited
 */
export async function logRateLimitViolation(
  ipAddress: string,
  userAgent: string,
  endpoint: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.RATE_LIMIT_VIOLATION,
    ipAddress,
    userAgent,
    outcome: 'failure',
    details: `Rate limit exceeded on ${endpoint}`
  });
}

/**
 * Logs a CSRF validation failure
 * 
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param details - Additional details about the failure
 */
export async function logCsrfValidationFailure(
  ipAddress: string,
  userAgent: string,
  details: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.CSRF_VALIDATION_FAILURE,
    ipAddress,
    userAgent,
    outcome: 'failure',
    details
  });
}

/**
 * Logs a token validation failure
 * 
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param reason - Validation failure reason
 * @param email - User email (if available)
 */
export async function logTokenValidationFailure(
  ipAddress: string,
  userAgent: string,
  reason: string,
  email?: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.TOKEN_VALIDATION_FAILURE,
    ipAddress,
    userAgent,
    outcome: 'failure',
    errorMessage: reason,
    email
  });
}

/**
 * Logs a session termination event
 * 
 * @param userId - The user ID whose session was terminated
 * @param reason - Termination reason
 * @param sessionsDeleted - Number of sessions deleted
 */
export async function logSessionTermination(
  userId: string,
  reason: string,
  sessionsDeleted: number
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.SESSION_TERMINATION,
    userId,
    ipAddress: 'system',
    userAgent: 'session-manager',
    outcome: 'success',
    details: `${sessionsDeleted} session(s) terminated | Reason: ${reason}`
  });
}

/**
 * Logs a user sign-out event
 * 
 * @param userId - The user ID who signed out
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param sessionToken - Session token that was deleted
 */
export async function logSignOut(
  userId: string,
  ipAddress: string,
  userAgent: string,
  sessionToken?: string
): Promise<void> {
  await logOAuthEvent({
    eventType: OAuthEventType.SIGN_OUT,
    userId,
    sessionId: sessionToken || 'all-sessions',
    ipAddress,
    userAgent,
    outcome: 'success',
    details: 'User signed out successfully'
  });
}
