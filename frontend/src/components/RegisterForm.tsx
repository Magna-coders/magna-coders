import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import SocialAuthButtons from './SocialAuthButtons';

interface RegisterFormProps {
  isDarkMode: boolean;
  onRegisterSuccess: () => void;
}

export default function RegisterForm({ isDarkMode, onRegisterSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
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
        throw new Error(data.message || 'Registration failed');
      }

      console.log('Register success:', data);
      
      // Store tokens and user data for auto-login
      const responseData = data.data || data;
      
      if (responseData.accessToken) localStorage.setItem('accessToken', responseData.accessToken);
      if (responseData.refreshToken) localStorage.setItem('refreshToken', responseData.refreshToken);
      
      const user = responseData.user || {};
      const userId = user.id || responseData.userId || responseData.id;

      if (userId) {
        localStorage.setItem('userid', userId);
      }
      
      if (user && Object.keys(user).length > 0) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      onRegisterSuccess();
    } catch (error: any) {
      console.error('Register error:', error);
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Google OAuth via NextAuth - redirect to sign in
    window.location.href = '/login?oauth=google';
  };

  const handleGithubLogin = () => {
    // GitHub OAuth not yet implemented
    setErrors({ general: 'GitHub authentication is not yet available. Please use Google or email/password.' });
  };

  // Theme constants
  const theme = {
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
    glow: isDarkMode ? "shadow-[0_0_50px_-12px_rgba(229,9,20,0.3)]" : "shadow-[0_0_40px_-10px_rgba(244,162,97,0.2)]",
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`relative z-10 w-full max-w-[420px] backdrop-blur-xl rounded-[24px] border shadow-2xl p-8 ${theme.cardBg} ${theme.glow} transition-all duration-500`}
      >
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-semibold mb-2 ${theme.textPrimary}`}>Create an account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm text-center">
            {errors.general}
          </motion.div>
        )}

        {/* Username Field */}
        <div className="space-y-2">
          <label htmlFor="username" className={`block text-sm font-medium ${theme.textSecondary}`}>
            Username
          </label>
          <div className="relative group">
            <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDarkMode ? 'text-gray-400 group-focus-within:text-[#E50914]' : 'text-gray-500 group-focus-within:text-[#E50914]'}`} />
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all duration-200 ${theme.inputBg} ${theme.inputBorder} ${theme.placeholder}`}
              placeholder="johndoe"
            />
          </div>
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
        </div>

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
              placeholder="Create a password"
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

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className={`block text-sm font-medium ${theme.textSecondary}`}>
            Confirm Password
          </label>
          <div className="relative group">
            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDarkMode ? 'text-gray-400 group-focus-within:text-[#E50914]' : 'text-gray-500 group-focus-within:text-[#E50914]'}`} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 rounded-lg border focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all duration-200 ${theme.inputBg} ${theme.inputBorder} ${theme.placeholder}`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 hover:text-[#E50914] transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Primary CTA */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#E50914] text-white py-3.5 px-6 rounded-full font-semibold shadow-[0_4px_14px_0_rgba(229,9,20,0.39)] hover:shadow-[0_6px_20px_rgba(229,9,20,0.23)] hover:bg-[#cc0812] transition-all duration-200 disabled:opacity-70 mt-4"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          ) : (
            "Sign Up"
          )}
        </motion.button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${theme.divider}`}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-2 ${isDarkMode ? 'bg-[#1A1A1A] text-gray-400' : 'bg-white/50 text-gray-500'} backdrop-blur-sm rounded`}>Or sign up with</span>
          </div>
        </div>

        {/* Social Buttons */}
        <SocialAuthButtons 
          isDarkMode={isDarkMode} 
          onGoogleClick={handleGoogleLogin}
          onGithubClick={handleGithubLogin}
        />
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
          <p className={`text-sm ${theme.textMuted}`}>
            Already have an account?{' '}
            <Link href="/login" className="text-[#F4A261] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
  );
}
