'use client';

import React from 'react';
import { 
  X, MapPin, Globe, Github, Linkedin, MessageCircle, 
  MessageSquare, UserPlus, UserCheck, LayoutGrid, Mail
} from 'lucide-react';
import Image from 'next/image';

// --- TYPES ---

interface ContactInfo {
  id: string;
  name: string;
  email: string;
  bio: string;
  roles?: string[];
  lookingFor?: string[];
  location: string;
  status?: string;
  connected?: boolean;
  avatarColor: string; // Tailwind class
  initials: string;
  avatar?: string; // URL
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
}

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: ContactInfo;
  isDarkMode?: boolean;
}

export default function ContactInfoModal({ 
  isOpen, 
  onClose, 
  contact,
  isDarkMode = false
}: ContactInfoModalProps) {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`md:rounded-3xl shadow-none md:shadow-2xl w-full md:max-w-md h-full md:h-auto md:max-h-[85vh] overflow-hidden relative flex flex-col animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between z-10 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
          <h2 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Contact Info</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Builder Card Style Content */}
          <div className="p-6 flex flex-col gap-6">
            
            {/* Header: Avatar & Info */}
            <div className="flex gap-4 items-start">
              <div className={`w-20 h-20 rounded-full ${contact.avatarColor || 'bg-gray-100'} flex items-center justify-center overflow-hidden flex-shrink-0 text-gray-500 font-bold text-2xl relative shadow-sm`}>
                {contact.avatar ? (
                  <Image src={contact.avatar} alt={contact.name} fill sizes="80px" className="object-cover" />
                ) : (
                  contact.initials
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-xl truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{contact.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                  <Mail size={12} />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                  <MapPin size={12} className="text-[#E50914]" />
                  <span className="truncate">{contact.location}</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{contact.bio}</p>
            </div>

            {/* Roles */}
            {contact.roles && contact.roles.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {contact.roles.map((role, idx) => (
                    <span key={idx} className={`px-3 py-1 rounded-full text-xs font-medium border ${idx === 0 ? 'bg-[#F4A261]/10 text-[#F4A261] border-[#F4A261]/20' : 'bg-[#E50914]/10 text-[#E50914] border-[#E50914]/20'}`}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Looking For */}
            {contact.lookingFor && contact.lookingFor.length > 0 && (
              <div className={`flex flex-col gap-3 p-4 rounded-xl ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between gap-2">
                   <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                     <span className="text-sm">👀</span>
                     <span>Looking for:</span>
                   </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {contact.lookingFor.map((item, idx) => (
                    <span key={idx} className={`px-2 py-0.5 border rounded-md text-[10px] font-medium ${isDarkMode ? 'bg-[#333] border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Socials */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Socials</h4>
              <div className="flex items-center gap-4 text-gray-400">
                {contact.websiteUrl && (
                  <a href={contact.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <Globe size={20} className="text-[#F4A261] cursor-pointer hover:opacity-80 transition-colors" />
                  </a>
                )}
                {contact.githubUrl && (
                  <a href={contact.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github size={20} className={`cursor-pointer hover:opacity-80 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  </a>
                )}
                {contact.linkedinUrl && (
                  <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Linkedin size={20} className="text-[#0077b5] cursor-pointer hover:opacity-80 transition-colors" />
                  </a>
                )}
                {contact.instagramUrl && (
                  <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="cursor-pointer hover:opacity-80 transition-colors">
                      <defs>
                        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FD5949" />
                          <stop offset="50%" stopColor="#D6249F" />
                          <stop offset="100%" stopColor="#285AEB" />
                        </linearGradient>
                      </defs>
                      <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#instagram-gradient)" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="4" stroke="url(#instagram-gradient)" strokeWidth="2" fill="none"/>
                      <circle cx="17.5" cy="6.5" r="1.5" fill="url(#instagram-gradient)"/>
                    </svg>
                  </a>
                )}
                {contact.whatsappUrl && (
                  <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={20} className="text-[#25D366] cursor-pointer hover:opacity-80 transition-colors" />
                  </a>
                )}
                {contact.twitterUrl && (
                  <a href={contact.twitterUrl} target="_blank" rel="noopener noreferrer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#1DA1F2] cursor-pointer hover:opacity-80 transition-colors">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
