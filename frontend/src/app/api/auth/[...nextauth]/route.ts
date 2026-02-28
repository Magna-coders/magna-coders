import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * NextAuth Configuration for Google OAuth Authentication
 * 
 * This configuration handles:
 * - Google OAuth 2.0 authentication flow
 * - Integration with backend OAuth callback endpoint
 * - JWT session management
 * - User data synchronization
 */

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (!account) {
          console.error('No account data received from OAuth provider');
          return false;
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${apiUrl}/api/auth/oauth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            tokenType: account.token_type,
            scope: account.scope,
            idToken: account.id_token,
            email: user.email,
            name: user.name,
            image: user.image
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Backend OAuth callback failed:', {
            status: response.status,
            message: errorData.message || 'Unknown error'
          });
          return false;
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          (account as any).backendAccessToken = data.data.accessToken;
          (account as any).backendRefreshToken = data.data.refreshToken;
          (account as any).backendSessionToken = data.data.sessionToken;
          (account as any).userId = data.data.user.id;
          (account as any).username = data.data.user.username;
        }
        
        return true;
        
      } catch (error: any) {
        console.error('Sign in callback error:', error.message);
        return false;
      }
    },
    
    async jwt({ token, account, user }) {
      if (account && user) {
        token.backendAccessToken = (account as any).backendAccessToken;
        token.backendRefreshToken = (account as any).backendRefreshToken;
        token.backendSessionToken = (account as any).backendSessionToken;
        token.userId = (account as any).userId;
        token.username = (account as any).username;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.userId as string,
          email: token.email as string,
          name: token.name as string,
          username: token.username as string,
          image: token.picture as string
        };
        
        (session as any).backendAccessToken = token.backendAccessToken;
        (session as any).backendRefreshToken = token.backendRefreshToken;
        (session as any).backendSessionToken = token.backendSessionToken;
      }
      
      return session;
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/login',
    newUser: '/auth/callback'
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
