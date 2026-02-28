import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

/**
 * NextAuth Type Extensions
 * 
 * Extends NextAuth types to include custom fields for backend integration:
 * - Backend JWT tokens (access, refresh, session)
 * - User ID and username from backend
 * 
 * Requirements:
 * - Requirement 5.1-5.4: JWT integration with backend
 * - Requirement 10.1-10.6: Session management
 */

declare module "next-auth" {
  /**
   * Extended Session interface
   * 
   * Adds backend tokens and user data to NextAuth session
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      image?: string;
    };
    backendAccessToken: string;
    backendRefreshToken: string;
    backendSessionToken: string;
  }

  /**
   * Extended User interface
   * 
   * Adds username to NextAuth user object
   */
  interface User extends DefaultUser {
    username?: string;
  }

  /**
   * Extended Account interface
   * 
   * Adds backend tokens to NextAuth account object
   */
  interface Account {
    backendAccessToken?: string;
    backendRefreshToken?: string;
    backendSessionToken?: string;
    userId?: string;
    username?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT interface
   * 
   * Adds backend tokens and user data to NextAuth JWT token
   */
  interface JWT extends DefaultJWT {
    userId?: string;
    username?: string;
    backendAccessToken?: string;
    backendRefreshToken?: string;
    backendSessionToken?: string;
  }
}
