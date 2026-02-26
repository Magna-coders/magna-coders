'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (session) {
      // Extract tokens from NextAuth session
      const backendAccessToken = (session as any).backendAccessToken;
      const backendRefreshToken = (session as any).backendRefreshToken;
      const userId = session.user?.id;
      const user = session.user;

      // Store in localStorage
      if (backendAccessToken) {
        localStorage.setItem('accessToken', backendAccessToken);
      }
      if (backendRefreshToken) {
        localStorage.setItem('refreshToken', backendRefreshToken);
      }
      if (userId) {
        // Store in both formats for compatibility
        localStorage.setItem('userId', userId);
        localStorage.setItem('userid', userId);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Small delay to ensure localStorage is written before redirect
      setTimeout(() => {
        // Redirect to user profile
        router.replace('/user-profile?from=nav');
      }, 100);
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-[#E50914] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#F9E4AD] text-lg">Completing sign in...</p>
      </div>
    </div>
  );
}
