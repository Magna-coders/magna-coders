import React from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
  isMobile?: boolean;
  isDarkMode?: boolean;
}

export function NavItem({ icon, label, badge, active, onClick, isMobile, isDarkMode }: NavItemProps) {
  return (
    <div 
      onClick={onClick}
      className={`relative w-full flex items-center ${isMobile ? 'justify-start px-4' : 'justify-center lg:justify-between px-2 lg:px-4'} py-3 rounded-full transition-all text-sm font-medium cursor-pointer ${
        active 
          ? 'bg-[#E50914] text-white shadow-md' 
          : isDarkMode 
            ? 'text-gray-400 hover:text-white hover:bg-white/10' 
            : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-0 lg:gap-3'}`}>
        {icon}
        <span className={isMobile ? 'block' : 'hidden lg:block'}>{label}</span>
      </div>
      {badge && (
        <span className={`hidden lg:block px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? 'bg-white text-[#E50914]' : 'bg-[#F4A261] text-white'
        }`}>
          {badge}
        </span>
      )}
      {/* Dot indicator for tablet mode if badge exists */}
      {badge && (
        <span className={`lg:hidden absolute top-2 right-2 w-2 h-2 rounded-full ${
          active ? 'bg-white' : 'bg-[#E50914]'
        }`}></span>
      )}
    </div>
  );
}
