"use client";

import React from 'react';
import { FolderKanban, Users, MessageSquare } from 'lucide-react';
import { Activity } from '@/app/user-profile/data';

interface ActivitiesTabProps {
  activities: Activity[];
  isDarkMode: boolean;
}

export default function ActivitiesTab({ activities, isDarkMode }: ActivitiesTabProps) {
  return (
    <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      <h3 className={`font-bold text-lg mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Recent Activity</h3>
      <div className={`space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] ${isDarkMode ? 'before:bg-[#333]' : 'before:bg-gray-100'}`}>
        {activities.map((activity, index) => (
          <div key={index} className="relative flex gap-4 pl-2">
            <div className={`w-10 h-10 rounded-full border-4 shadow-sm flex items-center justify-center z-10 flex-shrink-0 ${
              activity.type === 'project' ? 'bg-[#E50914] text-white border-transparent' : 
              activity.type === 'connection' ? 'bg-[#F4A261] text-white border-transparent' : 
              isDarkMode ? 'bg-[#333] text-gray-400 border-[#111]' : 'bg-gray-100 text-gray-600 border-white'
            }`}>
              {activity.type === 'project' && <FolderKanban size={18} />}
              {activity.type === 'connection' && <Users size={18} />}
              {activity.type === 'comment' && <MessageSquare size={18} />}
            </div>
            <div className="pt-1">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {activity.text}
              </p>
              <span className="text-xs text-gray-400 mt-1 block">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
