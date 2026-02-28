import React from 'react';
import Image from 'next/image';
import { Globe, Users, ChevronDown } from 'lucide-react';

interface UserPrivacySelectorProps {
  userName: string;
  userInitials: string;
  userAvatar?: string;
  privacy: string;
  onPrivacyChange: (privacy: string) => void;
  isDarkMode: boolean;
}

export default function UserPrivacySelector({ 
  userName, 
  userInitials, 
  userAvatar,
  privacy, 
  onPrivacyChange, 
  isDarkMode 
}: UserPrivacySelectorProps) {
  return (
    <div className="p-4 md:p-6 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-lg shadow-sm relative overflow-hidden">
        {userAvatar ? (
          <Image 
            src={userAvatar} 
            alt={userName} 
            fill 
            sizes="48px" 
            className="object-cover" 
          />
        ) : (
          userInitials
        )}
      </div>
      <div>
        <h3 className={`font-bold text-sm ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{userName}</h3>
        <button 
          className={`flex items-center gap-1.5 mt-0.5 text-xs font-medium transition-colors px-2 py-1 rounded-full ${isDarkMode ? 'bg-[#222] text-gray-400 hover:text-white hover:bg-[#333]' : 'text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => onPrivacyChange(privacy === 'Public' ? 'Connections' : 'Public')}
        >
          {privacy === 'Public' ? <Globe size={12} /> : <Users size={12} />}
          {privacy}
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
}
