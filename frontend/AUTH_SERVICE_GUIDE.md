# Authentication Service Integration Guide

This document explains how to use the centralized `authService` for all authenticated API calls and token management in the Magna Coders frontend application.

## Overview

The `authService` provides:
- **Automatic Token Refresh**: Handles 401 responses by refreshing the access token
- **Request Queue Management**: Queues requests while token is being refreshed
- **Token Validation**: Check token validity and expiration
- **Secure Storage**: Manages tokens in localStorage
- **Axios Integration**: Automatic Authorization header injection
- **Logout Handling**: Clear all tokens and redirect to login

## Setup

The auth service is already integrated with:
- `apiClient.ts` - Uses auth service's axios instance for all `apiFetch` calls
- All services that use `apiFetch` automatically get token refresh capability

## Usage Patterns

### Pattern 1: Using apiFetch (Recommended for most cases)

The `apiFetch` function now uses the auth service's axios instance with automatic token refresh:

```typescript
import { apiFetch } from '@/services/apiClient';

// GET request
const data = await apiFetch<UserData>('/users/123', { method: 'GET' });

// POST request
const result = await apiFetch<LoginResponse>('/auth/login', {
  method: 'POST',
  data: { email: 'user@example.com', password: 'password' }
});

// PUT request
await apiFetch('/users/123', {
  method: 'PUT',
  data: { name: 'New Name' }
});

// DELETE request
await apiFetch('/users/123', { method: 'DELETE' });
```

### Pattern 2: Using authService methods directly

For cases where you need more control or are not using apiFetch:

```typescript
import authService from '@/services/authService';

// GET request
const data = await authService.get<UserData>('/users/123');

// POST request
const result = await authService.post<LoginResponse>('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

// PUT request
await authService.put('/users/123', { name: 'New Name' });

// DELETE request
await authService.delete('/users/123');

// PATCH request
await authService.patch('/users/123', { field: 'value' });
```

### Pattern 3: Using fetchWithAuth for direct fetch calls

If you're using the native `fetch` API instead of axios:

```typescript
import authService from '@/services/authService';

// Simple GET
const response = await authService.fetchWithAuth(
  `${process.env.NEXT_PUBLIC_API_BASE}/users/123`
);
const data = await response.json();

// POST with body
const response = await authService.fetchWithAuth(
  `${process.env.NEXT_PUBLIC_API_BASE}/chat/messages`,
  {
    method: 'POST',
    body: JSON.stringify({ content: 'Hello' })
  }
);
```

### Pattern 4: Getting user information

```typescript
import authService from '@/services/authService';

// Get current user ID
const userId = authService.getUserId();

// Check if user is authenticated
if (authService.isAuthenticated()) {
  // User is logged in
}

// Check if token is expired (local check, no API call)
if (!authService.isTokenExpired()) {
  // Token is still valid
}

// Get access token (only if needed)
const token = authService.getAccessToken();

// Get refresh token (only if needed)
const refreshToken = authService.getRefreshToken();
```

## Token Refresh Flow

The auth service automatically handles token refresh with these steps:

1. **Request is made** with current access token
2. **Server returns 401** (token expired)
3. **Auth service detects 401** and checks if already refreshing
4. **If first 401**: Calls `/auth/refresh` endpoint with refresh token
   - Receives new access and refresh tokens
   - Stores new tokens in localStorage
   - Retries original request with new token
5. **If concurrent 401s**: Implementation queues subsequent requests
   - Waits for refresh to complete
   - Applies new token to all queued requests
6. **On refresh failure**: Logs out user and redirects to `/login`

## Migrating Existing Code

### Before (Direct localStorage access):

```typescript
const token = localStorage.getItem('accessToken');
const response = await fetch(`${apiUrl}/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### After (Using authService):

```typescript
const response = await authService.fetchWithAuth(`${apiUrl}/endpoint`);
```

Or use `apiFetch` if the existing code already imports it:

```typescript
const data = await apiFetch('/endpoint', { method: 'GET' });
```

## Files to Update

Priority order for updating existing code:

1. **High Priority** - Services that make API calls:
   - `src/services/friends.ts` - Already uses apiFetch ✓
   - `src/services/messages.ts` - Already uses apiFetch ✓
   - `src/services/users.ts` - Already uses apiFetch ✓
   - `src/services/opportunities.ts` - Already uses apiFetch ✓

2. **Medium Priority** - Components with direct fetch calls:
   - `src/components/SendCoinsModal.tsx` - Updated to use fetchWithAuth ✓
   - `src/components/PaymentMethodSettings.tsx` - Should use authService
   - `src/components/Checkout.tsx` - Should use authService
   - `src/components/JobPostDetails.tsx` - Should use authService
   - `src/components/TopNavigation.tsx` - Should use authService
   - `src/components/LeftPanel.tsx` - Should use authService

3. **Lower Priority** - UI/display components:
   - Other components that rarely make authenticated calls

## Token Lifecycle

```
┌─────────────────────────────────────────────┐
│          User Logs In                       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   Backend returns accessToken (7 days)      │
│   and refreshToken (30 days)                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   authService stores both in localStorage   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   Each request includes accessToken         │
│   in Authorization header                   │
└──────────────┬──────────────────────────────┘
               │
         ┌─────┴──────┐
         │            │
         ▼            ▼
    ┌────────┐   ┌──────────────┐
    │ Valid  │   │ Token Expired │
    │ (200)  │   │   (401)       │
    └────────┘   └──────┬───────┘
                        │
                        ▼
                 ┌────────────────────┐
                 │ Call /auth/refresh  │
                 │ with refreshToken   │
                 └────────┬────────────┘
                          │
                 ┌────────┴──────────┐
                 │                   │
                 ▼                   ▼
          ┌────────────┐      ┌──────────┐
          │ New tokens │      │ Refresh  │
          │ returned   │      │ expired  │
          │ (retry)    │      │ -> Logout│
          └────────────┘      └──────────┘
```

## Error Handling Examples

### Handle 401 with auto-refresh:

```typescript
try {
  const data = await apiFetch('/protected-endpoint', { method: 'GET' });
  console.log('Success:', data);
} catch (error) {
  console.error('Failed after token refresh attempt:', error);
  // If we get here, even refresh failed - user is logged out
}
```

### Validate token before API call:

```typescript
import authService from '@/services/authService';

if (authService.isTokenExpired()) {
  // Try to refresh before making actual request
  try {
    const tokens = await authService.refreshAccessToken();
    authService.storeTokens(tokens);
  } catch (error) {
    authService.logout();
    return;
  }
}

// Now make API call
const data = await apiFetch('/endpoint', { method: 'GET' });
```

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:5000/api
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

The auth service uses `NEXT_PUBLIC_API_BASE` for token management endpoints:
- `POST /auth/refresh` - Refresh access token
- `GET /auth/validate` - Validate token

## Best Practices

1. **Always use authService or apiFetch**: Never hardcode token handling
2. **Let service handle refresh**: Don't manually call refresh in components
3. **Error handling**: Catch API errors for user feedback, auth service handles token refresh automatically
4. **Check authentication state**: Use `authService.isAuthenticated()` before making requests
5. **Remember userId**: Use `authService.getUserId()` instead of localStorage directly
6. **Logout explicitly**: Call `authService.logout()` when logging out user

## Testing Token Refresh

To test the token refresh flow:

1. Make an authenticated API call
2. In browser DevTools, go to Application → LocalStorage
3. Manually expire the accessToken (change expiry metadata)
4. Make another API call - watch the Network tab for refresh call
5. Verify original request is retried with new token

## Troubleshooting

### "No refresh token available" error

**Cause**: User logged out or sessionStorage was cleared
**Solution**: Redirect to login page - already handled by authService

### "Token validation failed" error

**Cause**: Invalid token signature or user account deleted
**Solution**: Logout and redirect to login - already handled by authService

### Requests getting 401 but not refreshing

**Cause**: Refresh token is expired (>30 days)
**Solution**: User needs to login again - logout and send to login

### Multiple identical requests after refresh

**Cause**: Refresh queue is working correctly - requests are being queued
**Solution**: This is expected behavior, not a bug

## Further Reading

- [Backend Token Endpoints Documentation](../backend/TOKEN_MANAGEMENT.md)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
