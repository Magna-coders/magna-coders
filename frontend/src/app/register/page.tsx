'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import AuthBackground from '@/components/AuthBackground';
import ThemeToggle from '@/components/ThemeToggle';
import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
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

  // Prevent hydration mismatch
  if (!mounted) return null;

  // Theme Colors for page container
  const bgClass = isDarkMode 
      ? "bg-gradient-to-br from-[#0B0B0B] via-[#3A1C0F] to-[#0B0B0B]" 
      : "bg-gradient-to-br from-[#F9E8B2] to-[#FBE6A4]";

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col p-4 transition-colors duration-500 relative overflow-hidden`}>
      
      {/* Background Ambience */}
      <AuthBackground isDarkMode={isDarkMode} />

      {/* Top Navigation Area */}
      <TopNavigation 
        title="Create Account"
        onMobileMenuOpen={() => {}}
        showSearch={false}
        className="!left-0"
        isDarkMode={isDarkMode}
        showBack={true}
        customAction={
          <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        }
      />

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center pt-20">
        <RegisterForm 
          isDarkMode={isDarkMode} 
          onRegisterSuccess={() => router.push('/user-guide')}
        />
      </div>
    </div>
  );
}
