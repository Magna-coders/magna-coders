"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Connection } from '@/app/user-profile/data';
import FriendCard from './FriendCard';

interface ConnectionsTabProps {
  connections: Connection[];
  isDarkMode: boolean;
}

export default function ConnectionsTab({ connections, isDarkMode }: ConnectionsTabProps) {
  return (
    <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Connections</h3>
        <Link 
          href="/friends"
          className={`flex items-center gap-1 text-xs font-bold transition-colors ${isDarkMode ? 'text-[#E50914] hover:text-[#F4A261]' : 'text-[#E50914] hover:text-[#cc0812]'}`}
        >
          View All
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((connection, index) => {
          // Map Connection to Friend format for FriendCard
          const friendData = {
            id: index,
            name: connection.name,
            role: connection.role,
            company: 'Tech Corp', // Placeholder
            status: index % 3 === 0 ? 'online' : 'offline', // Placeholder
            mutual: 5 // Placeholder
          };

          return (
            <FriendCard key={index} friend={friendData} isDarkMode={isDarkMode} />
          );
        })}
      </div>
    </div>
  );
}
