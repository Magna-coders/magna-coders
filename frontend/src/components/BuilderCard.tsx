import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  UserPlus, MessageSquare, MapPin, 
  Github, Linkedin, MessageCircle, Globe 
} from 'lucide-react';

export interface Builder {
  id: number;
  name: string;
  email: string;
  bio: string;
  roles: string[];
  lookingFor: string[];
  location: string;
  status: string;
  connected: boolean;
  avatar: string | null;
}

interface BuilderCardProps {
  builder: Builder;
  isDarkMode: boolean;
  isCompact?: boolean;
}

const BuilderCard: React.FC<BuilderCardProps> = ({ builder, isDarkMode, isCompact = false }) => {
  if (isCompact) {
    return (
      <Link 
        href={`/user-profile?id=${builder.id}`} 
        className={`group block rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all h-full min-h-[140px] flex flex-col ${
          isDarkMode 
            ? 'bg-[#111] border-[#E70008]/20' 
            : 'bg-white border-gray-100'
        }`}
      >
        <div className={`p-2 flex items-start gap-2 border-b ${isDarkMode ? 'border-[#222]' : 'border-gray-50'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-sm ${
            isDarkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-50 text-gray-500'
          }`}>
            {builder.avatar ? (
              <Image src={builder.avatar} alt={builder.name} fill sizes="32px" className="object-cover" />
            ) : (
              <span className="font-bold text-xs">{builder.name.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-bold text-[10px] truncate leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {builder.name}
            </h3>
            <p className={`text-[8px] truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {builder.roles[0]}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 border border-white dark:border-[#111] flex-shrink-0 mt-1" title="Available" />
        </div>

        <div className="p-2 flex-1 flex flex-col gap-2 min-w-0">
          <p className={`text-[9px] line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {builder.bio.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')}
          </p>
          
          <div className="mt-auto flex items-center gap-1 text-[8px] text-gray-500">
             <MapPin size={10} />
             <span className="truncate">{builder.location}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/user-profile?id=${builder.id}`} 
      className={`group block rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full relative ${
        isDarkMode 
          ? 'bg-[#111] border border-[#E70008]/20 shadow-lg shadow-black/50' 
          : 'bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
      }`}
    >
      {/* ZONE A: HEADER (Identity) */}
      <div className="flex items-start gap-4 mb-6 pr-20">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-sm ${
            isDarkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-50 text-gray-500'
          }`}>
            {builder.avatar ? (
              <Image src={builder.avatar} alt={builder.name} fill sizes="56px" className="object-cover" />
            ) : (
              <span className="font-bold text-lg">{builder.name.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          
          {/* Name & Email */}
          <div className="min-w-0">
            <h3 className={`font-bold text-lg truncate leading-tight mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {builder.name}
            </h3>
            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {builder.email}
            </p>
          </div>
        </div>

        {/* Availability Badge - Absolute Positioned */}
        <div className={`absolute top-6 right-6 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide flex items-center gap-1.5 ${
          isDarkMode 
            ? 'bg-green-900/20 text-green-400' 
            : 'bg-green-50 text-green-700'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
          Available
        </div>
      </div>

      {/* ZONE B: BODY (About + Roles) */}
      <div className="mb-6 space-y-4">
        {/* Tagline */}
        <p className={`text-sm font-medium line-clamp-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {builder.bio.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')}
        </p>

        {/* Role Chips */}
        <div className="flex flex-wrap gap-2">
          {builder.roles.slice(0, 3).map((role, idx) => (
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
              {builder.lookingFor.slice(0, 2).map((item, idx) => (
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
            <span className="truncate max-w-[120px]">{builder.location}</span>
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
};

export default BuilderCard;
