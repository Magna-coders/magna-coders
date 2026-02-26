import React from 'react';

interface FilterPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  isDarkMode?: boolean;
}

export default function FilterPill({ label, active, onClick, isDarkMode }: FilterPillProps) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
      active
        ? 'bg-[#E50914] text-white shadow-md'
        : isDarkMode 
          ? 'bg-[#111] text-gray-300 border border-gray-800 hover:bg-[#222]' 
          : 'bg-white text-black hover:bg-gray-50'
    }`}
    >
      {label}
    </button>
  );
}
