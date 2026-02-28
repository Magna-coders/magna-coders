import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  UserPlus, MessageSquare, MapPin, 
  Github, Linkedin, MessageCircle, Globe 
} from 'lucide-react';

interface Friend {
  id: number;
  name: string;
  role: string;
  company: string;
  status: string;
  mutual: number;
  avatar?: string | null;
  email?: string;
  location?: string;
}

interface FriendCardProps {
  friend: Friend;
  isDarkMode?: boolean;
}

export default function FriendCard({ friend, isDarkMode = false }: FriendCardProps) {
  // Mock data to match BuilderCard structure if missing
  const builderData = {
    ...friend,
    email: friend.email || `${friend.name.toLowerCase().replace(' ', '.')}@example.com`,
    bio: "Passionate developer focused on creating intuitive user experiences and scalable applications.",
    roles: [friend.role, "Developer"],
    lookingFor: ["Collaboration", "Mentorship"],
    location: friend.location || "Nairobi, Kenya"
  };

  return (
    <Link 
      href={`/user-profile?id=${friend.id}`} 
      className={`group block rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full ${
        isDarkMode 
          ? 'bg-[#111] border border-[#E70008]/20 shadow-lg shadow-black/50' 
          : 'bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
      }`}
    >
      {/* ZONE A: HEADER (Identity) */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-sm ${
            isDarkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-50 text-gray-500'
          }`}>
            {builderData.avatar ? (
              <Image src={builderData.avatar} alt={builderData.name} fill sizes="56px" className="object-cover" />
            ) : (
              <span className="font-bold text-lg">{builderData.name.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          
          {/* Name & Email */}
          <div className="min-w-0">
            <h3 className={`font-bold text-lg truncate leading-tight mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {builderData.name}
            </h3>
            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {builderData.email}
            </p>
          </div>
        </div>

        {/* Availability Badge */}
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide flex items-center gap-1.5 flex-shrink-0 ${
          isDarkMode 
            ? 'bg-green-900/20 text-green-400' 
            : 'bg-green-50 text-green-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          {friend.status === 'online' ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* ZONE B: BODY (About + Roles) */}
      <div className="mb-6 space-y-4">
        {/* Tagline */}
        <p className={`text-sm font-medium line-clamp-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {builderData.bio}
        </p>

        {/* Role Chips */}
        <div className="flex flex-wrap gap-2">
          {builderData.roles.slice(0, 3).map((role, idx) => (
            <span 
              key={idx} 
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-[#222] text-gray-400 group-hover:bg-[#333] group-hover:text-gray-300' 
                  : 'bg-gray-50 text-gray-600 group-hover:bg-gray-100 group-hover:text-gray-800'
              }`}
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* ZONE C: INTENT + FOOTER */}
      <div className="mt-auto">
        {/* Looking For Section */}
        <div className={`p-4 rounded-xl mb-6 flex gap-4 ${isDarkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50/80'}`}>
          {/* Action Buttons Column */}
          <div className={`flex flex-col gap-2 border-r pr-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-[#333] text-gray-400 hover:text-white bg-[#222]' 
                  : 'hover:bg-white text-gray-500 hover:text-[#E50914] bg-white border border-gray-100 shadow-sm'
              }`}
              title="Connect"
            >
              <UserPlus size={16} />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-[#333] text-gray-400 hover:text-white bg-[#222]' 
                  : 'hover:bg-white text-gray-500 hover:text-[#E50914] bg-white border border-gray-100 shadow-sm'
              }`}
              title="Message"
            >
              <MessageSquare size={16} />
            </button>
          </div>

          {/* Looking For Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Looking for
            </h4>
            <div className="flex flex-wrap gap-2">
              {builderData.lookingFor.slice(0, 2).map((item, idx) => (
                <span 
                  key={idx} 
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${
                    isDarkMode 
                      ? 'border-gray-700 text-gray-400' 
                      : 'border-gray-200 text-gray-600 bg-white'
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px w-full mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}></div>

        {/* Footer: Location & Socials */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            <MapPin size={14} className="opacity-70" />
            <span className="truncate max-w-[120px]">{builderData.location}</span>
          </div>

          <div className="flex items-center gap-3">
            {[Github, Linkedin, Globe, MessageCircle].map((Icon, i) => (
              <div 
                key={i}
                className={`transition-colors ${
                  isDarkMode 
                    ? 'text-gray-600 hover:text-gray-300' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
