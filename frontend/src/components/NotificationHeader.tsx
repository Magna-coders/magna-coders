import React from 'react';
import { Trash2 } from 'lucide-react';

interface NotificationHeaderProps {
  isDarkMode: boolean;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export default function NotificationHeader({ 
  isDarkMode, 
  onMarkAllRead, 
  onClearAll 
}: NotificationHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
       <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
         Activity
       </h2>
       <div className="flex items-center gap-2">
          <button 
             onClick={onMarkAllRead}
             className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
               isDarkMode 
                 ? 'text-[#E50914] hover:bg-[#E50914]/10' 
                 : 'text-[#E50914] hover:bg-red-50'
             }`}
           >
             Mark all read
           </button>
           <button 
             onClick={onClearAll}
             className={`p-2 rounded-full transition-colors ${
               isDarkMode 
                 ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                 : 'text-gray-400 hover:text-black hover:bg-gray-100'
             }`}
             title="Clear all"
           >
             <Trash2 size={18} />
           </button>
       </div>
    </div>
  );
}
