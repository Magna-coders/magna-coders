"use client";

import React from 'react';

interface ProfileTabsProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
}

export default function ProfileTabs({ tabs, activeTab, setActiveTab, isDarkMode }: ProfileTabsProps) {
  return (
    <div className={`flex items-center gap-1 md:gap-8 border-b overflow-x-auto no-scrollbar ${isDarkMode ? 'border-[#E70008]/20' : 'border-gray-200'}`}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-1 py-4 text-sm font-medium relative whitespace-nowrap transition-colors ${
            activeTab === tab ? 'text-[#E50914]' : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E50914] rounded-t-full"></span>
          )}
          <span className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}>
            {tab}
          </span>
        </button>
      ))}
    </div>
  );
}
