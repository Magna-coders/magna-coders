'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Bell, Menu, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopNavigationProps {
  title: string;
  onMobileMenuOpen: () => void;
  className?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDarkMode?: boolean;
  showSearch?: boolean;
  customAction?: React.ReactNode;
  showBack?: boolean;
  hideBackOnMobile?: boolean;
}

export default function TopNavigation({ 
  title, 
  onMobileMenuOpen, 
  className = '', 
  searchPlaceholder = 'Search...', 
  searchValue, 
  onSearchChange, 
  isDarkMode = false,
  showSearch = true,
  customAction,
  showBack = false,
  hideBackOnMobile = false
}: TopNavigationProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiUrl || !token) return;

        const response = await fetch(`${apiUrl}/social/notifications/unread`, {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Assuming response: { count: 5 } or { unread_count: 5 }
          setUnreadCount(data.count || data.unread_count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications count', error);
      }
    };

    fetchUnreadCount();
    
    // Optional: Poll every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed top-0 right-0 z-30 backdrop-blur-sm border-b px-4 md:px-8 py-4 flex items-center justify-between transition-all duration-300 left-0 md:left-[88px] lg:left-[260px] ${className} ${isDarkMode ? 'bg-black/90 border-[#E70008]/20' : 'bg-white/90 border-gray-100'}`}>
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={() => router.back()}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#E70008]/10 text-[#F9E4AD]' : 'hover:bg-gray-100 text-black'} ${hideBackOnMobile ? 'hidden md:block' : ''}`}
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          <h1 className={`text-xl font-bold hidden md:block ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{title}</h1>
        {/* Mobile Logo */}
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#E70008] flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-[#F4A261]">Magna</span>
            <span className="text-[#E50914]">Coders</span>
          </span>
        </Link>
      </div>
    </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Bar (Desktop) */}
        {showSearch && (
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={onSearchChange}
              className={`rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#E50914] w-64 transition-all ${isDarkMode ? 'bg-[#111] border-[#E70008]/20 text-[#F9E4AD] placeholder-gray-500' : 'bg-gray-50 border-gray-100 text-black'}`}
            />
          </div>
        )}

        {/* Small Search Bar (Mobile) */}
        {showSearch && (
          <div className="flex md:hidden relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchValue}
              onChange={onSearchChange}
              className={`rounded-full pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#E50914] w-28 transition-all ${isDarkMode ? 'bg-[#111] border-[#E70008]/20 text-[#F9E4AD] placeholder-gray-500' : 'bg-gray-50 border-gray-100 text-black'}`}
            />
          </div>
        )}

        {/* Notification Icon */}
        <Link href="/notifications" className={`relative p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#E70008]/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Bell size={24} />
          {unreadCount > 0 && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-[#E50914] rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </Link>
        
        {/* Custom Action */}
        {customAction && (
          <div className="flex items-center">
            {customAction}
          </div>
        )}
        
        {/* Mobile Menu Icon */}
        <button 
          className={`md:hidden p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#E70008]/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          onClick={onMobileMenuOpen}
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
}
