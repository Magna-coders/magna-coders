"use client";

import React from 'react';
import { UserProfile } from '@/app/user-profile/data';

interface OverviewTabProps {
  user: UserProfile;
  isDarkMode: boolean;
}

export default function OverviewTab({ user, isDarkMode }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-6">
        {/* About Card */}
        <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
          <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>About</h3>
          <p className={`leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {user.bio}
          </p>
        </div>

        {/* Social Links Card */}
        {user.socials && user.socials.length > 0 && (
          <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
            <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Social Links</h3>
            <div className="flex flex-wrap gap-4">
              {user.socials.map(social => (
                <a 
                  key={social.name}
                  href={social.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors group ${isDarkMode ? 'bg-[#222] hover:bg-[#333]' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <social.icon size={18} className={`${social.color}`} />
                  <span className={`text-sm font-medium ${social.color}`}>{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        {/* Stats Card */}
        <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
          <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Stats</h3>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Connections</span>
              <span className="font-bold text-[#F4A261]">{user.stats.connections}</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Projects</span>
              <span className="font-bold text-[#E50914]">{user.stats.projects}</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Skills</span>
              <span className="font-bold text-blue-500">{user.stats.skills}</span>
            </div>
          </div>
        </div>

        {/* Availability Card */}
        <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
          <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Availability</h3>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${isDarkMode ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-green-50 text-green-600 border-green-100'}`}>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Available for work
          </span>
        </div>
      </div>
    </div>
  );
}
