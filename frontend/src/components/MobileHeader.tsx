import React from 'react';
import Link from 'next/link';
import { Search, Menu } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-4 flex items-center justify-between shadow-sm gap-4">
       <Link href="/feed" className="flex-shrink-0 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#E50914]">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
       </Link>
       
       {/* Mobile Search Bar */}
       <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search friends..." 
            className="w-full bg-gray-50 border border-gray-100 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-all"
          />
       </div>

       <button 
          className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          onClick={onMenuClick}
       >
          <Menu size={24} />
       </button>
    </div>
  );
}
