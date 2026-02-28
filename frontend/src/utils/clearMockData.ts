/**
 * Utility to clear mock/old session data from localStorage
 * This helps resolve issues where old mock data interferes with real authentication
 */

export function clearMockSessionData() {
  if (typeof window === 'undefined') return;
  
  // Only clear theme, not authentication tokens
  // Authentication tokens should only be cleared on explicit logout
  const keysToRemove = [
    'theme'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ Cleared old session data from localStorage');
}

export function clearAllAuthData() {
  if (typeof window === 'undefined') return;
  
  // Clear all auth-related data
  clearMockSessionData();
  
  // Clear NextAuth session cookies by setting them to expire
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  console.log('✅ Cleared all authentication data');
}
