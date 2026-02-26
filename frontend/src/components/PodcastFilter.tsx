import React from 'react';

interface PodcastFilterProps {
  isDarkMode: boolean;
}

export default function PodcastFilter({ isDarkMode }: PodcastFilterProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Latest Episodes</h2>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${isDarkMode ? 'bg-[#E50914] text-white' : 'bg-[#E50914] text-white shadow-md'}`}>All Episodes</button>
        <button className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${isDarkMode ? 'border-gray-800 text-gray-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Tech Talk</button>
        <button className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${isDarkMode ? 'border-gray-800 text-gray-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Developer Stories</button>
        <button className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${isDarkMode ? 'border-gray-800 text-gray-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Career Growth</button>
      </div>
    </div>
  );
}
