import React from 'react';
import { Briefcase, FolderKanban } from 'lucide-react';

interface NotificationFiltersProps {
  filter: 'all' | 'job_opportunities' | 'projects';
  setFilter: (filter: 'all' | 'job_opportunities' | 'projects') => void;
  hasUnread: (type: 'all' | 'job_opportunities' | 'projects') => boolean;
  isDarkMode: boolean;
}

export default function NotificationFilters({ 
  filter, 
  setFilter, 
  hasUnread, 
  isDarkMode 
}: NotificationFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto mb-8 pb-2 scrollbar-hide">
      <button
        onClick={() => setFilter('all')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
          filter === 'all' 
            ? 'bg-[#E50914] text-white shadow-md' 
            : isDarkMode ? 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        All
        {hasUnread('all') && (
          <span className={`w-2 h-2 rounded-full ${filter === 'all' ? 'bg-white' : 'bg-[#E50914]'}`}></span>
        )}
      </button>
      <button
        onClick={() => setFilter('job_opportunities')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
          filter === 'job_opportunities' 
            ? 'bg-[#E50914] text-white shadow-md' 
            : isDarkMode ? 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <Briefcase size={16} />
        <span>Jobs</span>
        {hasUnread('job_opportunities') && (
          <span className={`w-2 h-2 rounded-full ${filter === 'job_opportunities' ? 'bg-white' : 'bg-[#E50914]'}`}></span>
        )}
      </button>
      <button
        onClick={() => setFilter('projects')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
          filter === 'projects' 
             ? 'bg-[#E50914] text-white shadow-md' 
            : isDarkMode ? 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <FolderKanban size={16} />
        <span>Projects</span>
        {hasUnread('projects') && (
          <span className={`w-2 h-2 rounded-full ${filter === 'projects' ? 'bg-white' : 'bg-[#E50914]'}`}></span>
        )}
      </button>
    </div>
  );
}
