import React from 'react';

interface TabFiltersProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
}

export default function TabFilters({ tabs, activeTab, onTabChange, isDarkMode }: TabFiltersProps) {
  return (
    <div className={`flex items-center gap-6 border-b mb-8 overflow-x-auto no-scrollbar ${
      isDarkMode ? 'border-[#E70008]/20' : 'border-gray-200'
    }`}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`pb-4 px-2 text-sm font-bold whitespace-nowrap relative transition-colors ${
            activeTab === tab 
              ? 'text-[#E50914]' 
              : isDarkMode ? 'text-gray-500 hover:text-[#F9E4AD]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E50914] rounded-t-full shadow-[0_0_10px_rgba(231,0,8,0.8)]"></span>
          )}
        </button>
      ))}
    </div>
  );
}
