# Production Security Guide - Google OAuth Authentication

This document provides comprehensive security guidelines for deploying the Magna Coders platform with Google OAuth authentication in production.

## Table of Contents

1. [HTTPS Requirements](#https-requirements)
2. [Cookie Security](#cookie-security)
3. [Security Headers](#security-headers)
4. [Environment Configuration](#environment-configuration)
5. [OAuth Configuration](#oauth-configuration)
6. [Deployment Checklist](#deployment-checklist)
7. [Security Verification](#security-verification)

## HTTPS Requirements

### Why HTTPS is Critical

OAuth 2.0 authentication **REQUIRES** HTTPS in production for several security reasons:

- **Token Protection**: OAuth tokens transmitted over HTTP can be intercepted by attackers
- **Cookie Security**: Secure cookies (with `secure=true` flag) only work over HTTPS
- **CSRF Protection**: OAuth state parameters need secure transmission
- **OAuth Provider Requirements**: Google requires HTTPS for production OAuth redirect URIs

### HTTPS Configuration

1. **Obtain SSL/TLS Certificate**
   - Use Let's Encrypt for free certificates
   - Or use your hosting provider's SSL service (Vercel, Netlify, etc.)
   - Ensure certificate covers your domain and all subdomains

2. **Configure NEXTAUTH_URL**
   ```bash
   # ❌ WRONG - HTTP in production
   NEXTAUTH_URL=http://magna-coders.com
   
   # ✅ CORRECT - HTTPS in production
   NEXTAUTH_URL=https://magna-coders.com
   ```

3. **Configure API URLs**
   ```bash
   # All API URLs must use HTTPS in production
   NEXT_PUBLIC_API_URL=https://api.magna-coders.com
   NEXT_PUBLIC_AI_BACKEND_URL=https://ai.magna-coders.com
   ```

4. **Update Google OAuth Redirect URIs**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Update Authorized redirect URIs to use `https://`
   - Example: `https://magna-coders.com/api/auth/callback/google`

## Cookie Security

### Automatic Security in Production

When `NODE_ENV=production`, the following cookie security settings are **automatically enforced**:

```typescript
{
  httpOnly: true,      // Prevents JavaScript access (XSS protection)
  secure: true,        // Requires HTTPS (automatically enabled in production)
  sameSite: 'lax',     // Prevents CSRF attacks
  maxAge: 604800       // 7 days (matches JWT access token expiration)
}
```

### Cookie Prefixes

In production, cookies use security prefixes:

- `__Secure-next-auth.session-token`: Session token cookie
- `__Secure-next-auth.callback-url`: OAuth callback URL cookie
- `__Host-next-auth.csrf-token`: CSRF protection token

These prefixes provide additional security guarantees enforced by browsers.

### Cookie Security Features

1. **httpOnly=true**
   - Prevents JavaScript from accessing cookies
   - Protects against XSS (Cross-Site Scripting) attacks
   - Cookies only accessible via HTTP requests

2. **secure=true**
   - Cookies only transmitted over HTTPS
   - Prevents man-in-the-middle attacks
   - Automatically enabled when `NODE_ENV=production`

3. **sameSite='lax'**
   - Prevents CSRF (Cross-Site Request Forgery) attacks
   - Allows OAuth redirects to work correctly
   - Balances security and functionality

4. **maxAge=7 days**
   - Matches JWT access token expiration
   - Forces re-authentication after 7 days
   - Reduces risk of stolen token abuse

## Security Headers

### Automatically Added Headers

The following security headers are **automatically added** in production:

```javascript
// Strict-Transport-Security (HSTS)
// Forces HTTPS for 1 year, including all subdomains
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'

// X-Frame-Options
// Prevents clickjacking attacks
'X-Frame-Options': 'DENY'

// X-Content-Type-Options
// Prevents MIME type sniffing
'X-Content-Type-Options': 'nosniff'

// Referrer-Policy
// Controls referrer information sent with requests
'Referrer-Policy': 'origin-when-cross-origin'
```

### HSTS (HTTP Strict Transport Security)

HSTS forces browsers to always use HTTPS:

- **max-age=31536000**: Enforced for 1 year (31,536,000 seconds)
- **includeSubDomains**: Applies to all subdomains
- **preload**: Eligible for browser HSTS preload lists

**Important**: HSTS is only added in production (`NODE_ENV=production`) to avoid issues during local development.

### Header Verification

After deployment, verify headers are present:

```bash
# Check security headers
curl -I https://your-domain.com

# Expected output should include:
# strict-transport-security: max-age=31536000; includeSubDomains; preload
# x-frame-options: DENY
# x-content-type-options: nosniff
```

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file (never commit to git):

```bash
# Environment
NODE_ENV=production

# Frontend URL (MUST use https://)
NEXTAUTH_URL=https://magna-coders.com

# NextAuth Secret (generate new for production)
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Google OAuth (production credentials)
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-client-secret>

# Backend APIs (MUST use https://)
NEXT_PUBLIC_API_URL=https://api.magna-coders.com
NEXT_PUBLIC_AI_BACKEND_URL=https://ai.magna-coders.com
```

### Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Example output:
# 8xK9mP2nQ5rS7tU1vW3xY4zA6bC8dE0fG2hI4jK6lM8=
```

### Environment Variable Validation

The application validates required environment variables on startup:

- Missing variables will cause startup failure
- Error messages indicate which variables are missing
- Prevents deployment with incomplete configuration

## OAuth Configuration

### Google Cloud Console Setup

1. **Create Production OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create new OAuth 2.0 Client ID for production
   - Application type: Web application

2. **Configure Authorized JavaScript Origins**
   ```
   https://magna-coders.com
   ```

3. **Configure Authorized Redirect URIs**
   ```
   https://magna-coders.com/api/auth/callback/google
   ```

4. **Important Notes**
   - Do NOT use `http://` in production redirect URIs
   - Do NOT use `localhost` in production credentials
   - Use separate credentials for development and production

### OAuth Security Features

The implementation includes:

- **PKCE (Proof Key for Code Exchange)**: Protects against authorization code interception
- **State Parameter**: 32+ character random string for CSRF protection
- **Token Validation**: Verifies signature, expiration, audience, and issuer
- **Rate Limiting**: 5 OAuth attempts per IP per 15 minutes
- **Audit Logging**: All OAuth attempts logged with timestamp, IP, and outcome

## Deployment Checklist

### Pre-Deployment

- [ ] SSL/TLS certificate obtained and configured
- [ ] Production environment variables configured
- [ ] NEXTAUTH_SECRET generated (unique for production)
- [ ] Google OAuth production credentials created
- [ ] OAuth redirect URIs updated to use `https://`
- [ ] Backend API configured with HTTPS
- [ ] AI Backend API configured with HTTPS
- [ ] CORS settings updated for production domain

### Deployment

- [ ] Deploy frontend with `NODE_ENV=production`
- [ ] Verify HTTPS is working (no certificate errors)
- [ ] Test OAuth flow end-to-end
- [ ] Verify cookies have `secure=true` flag
- [ ] Verify security headers are present
- [ ] Test account creation and linking
- [ ] Test token refresh mechanism

### Post-Deployment

- [ ] Monitor OAuth audit logs for suspicious activity
- [ ] Set up alerts for rate limit violations
- [ ] Monitor error logs for authentication failures
- [ ] Test from multiple browsers and devices
- [ ] Verify mobile OAuth flow works correctly

## Security Verification

### 1. Verify HTTPS

```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Should show valid certificate chain
```

### 2. Verify Security Headers

```bash
# Check all security headers
curl -I https://your-domain.com

# Verify presence of:
# - strict-transport-security
# - x-frame-options
# - x-content-type-options
# - referrer-policy
```

### 3. Verify Cookie Security

1. Open browser DevTools (F12)
2. Go to Application > Cookies
3. Check session cookie properties:
   - ✅ HttpOnly: true
   - ✅ Secure: true
   - ✅ SameSite: Lax
   - ✅ Domain: your-domain.com

### 4. Verify OAuth Flow

1. Click "Sign in with Google"
2. Complete OAuth authorization
3. Verify redirect to HTTPS URL
4. Check browser console for errors
5. Verify successful authentication

### 5. Security Testing Tools

Use these tools to verify security:

- [SSL Labs](https://www.ssllabs.com/ssltest/): Test SSL/TLS configuration
- [Security Headers](https://securityheaders.com/): Verify security headers
- [Mozilla Observatory](https://observatory.mozilla.org/): Comprehensive security scan

### 6. Common Issues

**Issue**: OAuth fails with "redirect_uri_mismatch"
- **Solution**: Update Google Cloud Console redirect URIs to use `https://`

**Issue**: Cookies not being set
- **Solution**: Verify `NEXTAUTH_URL` uses `https://` in production

**Issue**: HSTS header not present
- **Solution**: Verify `NODE_ENV=production` is set

**Issue**: "Mixed content" warnings
- **Solution**: Ensure all API URLs use `https://`

## Additional Security Recommendations

### 1. Content Security Policy (CSP)

Consider adding CSP headers for additional protection:

```javascript
// In next.config.js headers()
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
}
```

### 2. Rate Limiting

OAuth endpoints have built-in rate limiting:
- 5 attempts per IP per 15 minutes
- Prevents brute force attacks
- Monitor logs for rate limit violations

### 3. Audit Logging

All OAuth events are logged:
- Authentication attempts (success/failure)
- Token refresh operations
- Account linking attempts
- Rate limit violations
- CSRF validation failures

Review logs regularly for suspicious activity.

### 4. Token Encryption

OAuth tokens are encrypted at rest:
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 from JWT_SECRET
- Unique IV per encryption operation
- Protects tokens if database is compromised

### 5. Session Management

- Sessions expire after 30 days
- JWT access tokens expire after 7 days
- Refresh tokens expire after 30 days
- Expired sessions automatically cleaned up

## Support and Resources

### Documentation

- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Internal Documentation

- `frontend/.env.example`: Environment variable reference
- `frontend/next.config.js`: Security headers configuration
- `frontend/src/app/api/auth/[...nextauth]/route.ts`: OAuth configuration

### Security Contacts

If you discover a security vulnerability:
1. Do NOT create a public GitHub issue
2. Contact the security team directly
3. Provide detailed information about the vulnerability
4. Allow time for patching before public disclosure

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
