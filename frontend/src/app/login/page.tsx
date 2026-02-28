'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Sun, Moon, Github, Chrome, ArrowLeft } from 'lucide-react';
import { signIn } from 'next-auth/react';
import TopNavigation from '@/components/TopNavigation';

export default function LoginPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Handle theme persistence
  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem('theme');
    // Default to dark mode if no preference, or check system preference
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.email,
          password: formData.password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log('Login successful:', data);
      
      // Store tokens and user data
      const responseData = data.data || data;
      
      if (responseData.accessToken) localStorage.setItem('accessToken', responseData.accessToken);
      if (responseData.refreshToken) localStorage.setItem('refreshToken', responseData.refreshToken);
      
      const user = responseData.user || {};
      const userId = user.id || responseData.userId || responseData.id;

      if (userId) {
        // Store in both formats for compatibility
        localStorage.setItem('userId', userId);
        localStorage.setItem('userid', userId);
      }
      
      if (user && Object.keys(user).length > 0) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        const fallbackUser = { id: userId, email: formData.email };
        localStorage.setItem('user', JSON.stringify(fallbackUser));
      }

      // Redirect to feed
      window.location.href = '/feed';
    } catch (err: any) {
      console.error('Login error:', err);
      setErrors({ form: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrors({});
      
      // Check if backend is reachable before attempting OAuth
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      try {
        const healthCheck = await fetch(`${apiUrl}/health`, { method: 'GET' });
        if (!healthCheck.ok) {
          throw new Error('Backend server is not responding');
        }
      } catch (healthError) {
        setErrors({ 
          form: 'Cannot connect to backend server. Please ensure the backend is running on port 5000.' 
        });
        setIsGoogleLoading(false);
        return;
      }
      
      // Trigger NextAuth Google sign-in with redirect
      // This will open Google's OAuth popup
      await signIn('google', {
        callbackUrl: '/auth/callback',
      });
      
      // Note: If we reach here, sign-in was cancelled or failed
      // The page will redirect on success, so we only handle errors
      setIsGoogleLoading(false);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setErrors({ form: err.message || 'Connection error. Please try again.' });
      setIsGoogleLoading(false);
    }
  };

  const handleGithubLogin = () => {
    // GitHub OAuth not yet implemented
    setErrors({ form: 'GitHub authentication is not yet available. Please use Google or email/password.' });
  };


  // Prevent hydration mismatch
  if (!mounted) return null;

  // Theme Colors
  const theme = {
    bg: isDarkMode 
      ? "bg-gradient-to-br from-[#0B0B0B] via-[#3A1C0F] to-[#0B0B0B]" 
      : "bg-gradient-to-br from-[#F9E8B2] to-[#FBE6A4]",
    textPrimary: isDarkMode ? "text-white" : "text-black",
    textSecondary: isDarkMode ? "text-[#CCCCCC]" : "text-[#444444]",
    textMuted: isDarkMode ? "text-[#999999]" : "text-[#777777]",
    cardBg: isDarkMode 
      ? "bg-[#1A1A1A]/60 border-white/10" 
      : "bg-white/40 border-white/40",
    inputBg: isDarkMode ? "bg-black/30 text-white" : "bg-white/60 text-black",
    inputBorder: isDarkMode ? "border-white/10" : "border-white/50",
    placeholder: isDarkMode ? "placeholder-gray-500" : "placeholder-gray-500",
    divider: isDarkMode ? "bg-gray-700" : "bg-gray-300",
    socialBtn: isDarkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-white/60 hover:bg-white/80 text-black",
    glow: isDarkMode ? "shadow-[0_0_50px_-12px_rgba(229,9,20,0.3)]" : "shadow-[0_0_40px_-10px_rgba(244,162,97,0.2)]",
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4 transition-colors duration-500 relative overflow-hidden`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isDarkMode ? (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#5C2400] opacity-20 rounded-full blur-[100px]"></div>
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            }}></div>
          </>
        ) : (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F4A261] opacity-10 rounded-full blur-[100px]"></div>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
          </>
        )}
      </div>

      {/* Top Navigation Area */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className={`p-2 rounded-full hover:bg-black/5 transition-colors ${theme.textPrimary}`}>
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#E50914]">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <span className={`text-xl font-bold ${theme.textPrimary}`}>
              <span className="text-[#F4A261]">Magna</span>
              <span className="text-[#E50914]">Coders</span>
            </span>
          </div>
        </div>

        <button 
          onClick={toggleTheme}
          className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#E50914] ${isDarkMode ? 'bg-gray-800' : 'bg-[#FBE6A4] border border-[#F4A261]/30'}`}
        >
          <div className="absolute inset-0 flex justify-between items-center px-2">
            <Sun className="w-4 h-4 text-[#E50914]" />
            <Moon className="w-4 h-4 text-[#F4A261]" />
          </div>
          <motion.div 
            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md"
            animate={{ x: isDarkMode ? 32 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`relative z-10 w-full max-w-[420px] backdrop-blur-xl rounded-[24px] border shadow-2xl p-8 ${theme.cardBg} ${theme.glow} transition-all duration-500`}
      >
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-semibold mb-2 ${theme.textPrimary}`}>Sign in to continue</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.form && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm text-center">
              {errors.form}
            </motion.div>
          )}

          {errors.general && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm text-center">
              {errors.general}
            </motion.div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className={`block text-sm font-medium ${theme.textSecondary}`}>
              Email Address
            </label>
            <div className="relative group">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDarkMode ? 'text-gray-400 group-focus-within:text-[#E50914]' : 'text-gray-500 group-focus-within:text-[#E50914]'}`} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all duration-200 ${theme.inputBg} ${theme.inputBorder} ${theme.placeholder}`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className={`block text-sm font-medium ${theme.textSecondary}`}>
              Password
            </label>
            <div className="relative group">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDarkMode ? 'text-gray-400 group-focus-within:text-[#E50914]' : 'text-gray-500 group-focus-within:text-[#E50914]'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all duration-200 ${theme.inputBg} ${theme.inputBorder} ${theme.placeholder}`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 hover:text-[#E50914] transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between text-sm">
            <label className={`flex items-center cursor-pointer ${theme.textMuted} hover:${theme.textSecondary}`}>
              <input
                type="checkbox"
                className="mr-2 rounded border-gray-400 text-[#E50914] focus:ring-[#E50914]"
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-[#F4A261] hover:underline transition-all">
              Forgot password?
            </Link>
          </div>

          {/* Primary CTA */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#E50914] text-white py-3.5 px-6 rounded-full font-semibold shadow-[0_4px_14px_0_rgba(229,9,20,0.39)] hover:shadow-[0_6px_20px_rgba(229,9,20,0.23)] hover:bg-[#cc0812] transition-all duration-200 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
            ) : (
              "Sign In"
            )}
          </motion.button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${theme.divider}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${isDarkMode ? 'bg-[#1A1A1A] text-gray-400' : 'bg-white/50 text-gray-500'} backdrop-blur-sm rounded`}>Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-full border border-transparent transition-all ${theme.socialBtn} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Chrome className="w-5 h-5" />
                  <span className="font-medium text-sm">Google</span>
                </>
              )}
            </button>
            <button
            onClick={handleGithubLogin}
             type="button" className={`flex items-center justify-center gap-2 py-2.5 rounded-full border border-transparent transition-all ${theme.socialBtn}`}>
              <Github className="w-5 h-5" />
              <span className="font-medium text-sm">GitHub</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${theme.textMuted}`}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#F4A261] font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
