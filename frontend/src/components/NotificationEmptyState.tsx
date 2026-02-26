import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationEmptyStateProps {
  isDarkMode: boolean;
}

export default function NotificationEmptyState({ isDarkMode }: NotificationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
        <Bell size={32} className="opacity-20" />
      </div>
      <p className="text-sm font-medium">No new notifications</p>
    </div>
  );
}
