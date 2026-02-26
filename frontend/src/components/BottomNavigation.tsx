'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, MessageSquare, User, FileText } from 'lucide-react';

export default function BottomNavigation() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme');
      setIsDarkMode(currentTheme === 'dark');
    };

    window.addEventListener('themeChanged', handleThemeChange);
    // Also listen for storage events (cross-tab)
    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  if (!pathname) return null;

  // Do not show on auth pages or specific routes
  if (['/login', '/create-account', '/new-login-2'].includes(pathname)) {
    return null;
  }

  const navItems = [
    {
      label: 'Feed',
      href: '/feed',
      icon: LayoutDashboard,
    },
    {
      label: 'Search Builders',
      href: '/builders',
      icon: Search,
    },
    {
      label: 'Chats',
      href: '/messages',
      icon: MessageSquare,
    },
    {
      label: 'Profile',
      href: '/user-profile',
      icon: User,
    },
    {
      label: 'Contract',
      href: '/contract',
      icon: FileText,
    },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t px-6 py-3 md:hidden z-50 flex justify-between items-center pb-5 pt-3 transition-colors duration-300 ${isDarkMode ? 'bg-black border-[#E70008]/20 shadow-[0_-4px_6px_-1px_rgba(231,0,8,0.1)]' : 'bg-white border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'}`}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
        
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex flex-col items-center gap-1 transition-colors ${isDarkMode ? (isActive ? 'text-[#E50914]' : 'text-[#F4A261] hover:text-white') : 'text-black'}`}
          >
            <item.icon size={24} color={isDarkMode ? (isActive ? '#E50914' : '#F4A261') : 'black'} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''} ${isDarkMode ? (isActive ? 'text-[#E50914]' : 'text-[#F4A261]') : 'text-black'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
