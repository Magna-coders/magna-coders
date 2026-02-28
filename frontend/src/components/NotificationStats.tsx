import React from 'react';
import { Users } from 'lucide-react';

interface NotificationStatsProps {
  requestsCount: number;
  filter: 'all' | 'job_opportunities' | 'projects';
  isDarkMode: boolean;
}

export default function NotificationStats({ 
  requestsCount, 
  filter, 
  isDarkMode 
}: NotificationStatsProps) {
  if (filter === 'all') return null;

  return (
    <div className={`mb-6 p-4 rounded-xl border ${isDarkMode ? 'bg-[#E50914]/10 border-[#E50914]/20' : 'bg-red-50 border-red-100'}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center text-white">
          <Users size={16} />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {requestsCount} {filter === 'job_opportunities' ? 'Applicants' : 'Requests'} Pending
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filter === 'job_opportunities' 
              ? 'Total number of users requesting to join your job opportunities.' 
              : 'Total number of users requesting to join your projects.'}
          </p>
        </div>
      </div>
    </div>
  );
}
