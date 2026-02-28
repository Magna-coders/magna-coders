"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BadgeCheck, MapPin, MoreHorizontal, Edit, Github, Linkedin, Globe, Twitter, Instagram, MessageCircle } from 'lucide-react';
import { UserProfile } from '@/app/user-profile/data';

interface ProfileHeaderProps {
  user: UserProfile;
  isDarkMode: boolean;
  isFromNav: boolean;
}

export default function ProfileHeader({ user, isDarkMode, isFromNav }: ProfileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
        const token = localStorage.getItem('accessToken');
        if (!userId || !token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setProfileData(result.data || result);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const avatarUrl = profileData?.avatar_url ? `${process.env.NEXT_PUBLIC_API_URL}${profileData.avatar_url}` : null;
  const displayName = profileData?.username || user.name;
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className={`rounded-2xl p-4 md:p-8 shadow-sm border relative ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      {/* Background Pattern/Banner (Optional) */}
      <div className={`absolute top-0 left-0 w-full h-32 opacity-50 rounded-t-2xl ${isDarkMode ? 'bg-gradient-to-r from-[#222] to-[#333]' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}></div>

      <div className="relative flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-end text-center md:text-left">
        {/* Avatar */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-black p-1 shadow-xl -mt-12 md:-mt-0 z-10 relative group mx-auto md:mx-0">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-white font-bold">{firstLetter}</div>
            )}
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-2 w-full">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
              {profileData?.username || user.name}
            </h1>
            <BadgeCheck className="text-[#E50914]" size={24} fill={isDarkMode ? 'black' : 'white'} />
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {profileData?.location || user.location}
            </span>
          </div>

          {profileData?.bio && (
            <p className={`text-sm mb-3 text-center md:text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {profileData.bio}
            </p>
          )}

          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
            <span className="px-3 py-1 bg-[#F4A261]/10 text-[#d98236] rounded-lg text-xs font-bold border border-[#F4A261]/20">
              {user.role}
            </span>
            <span className="px-3 py-1 bg-[#E50914]/10 text-[#E50914] rounded-lg text-xs font-bold border border-[#E50914]/20">
              {user.secondaryRole}
            </span>
          </div>
          
          <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
            <span className="hover:text-[#E50914] cursor-pointer transition-colors">
              <span className={`font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{user.stats.connections}</span> connections
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="hover:text-[#E50914] cursor-pointer transition-colors">
              <span className={`font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{user.stats.mutualConnections}</span> mutual connections
            </span>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
             {profileData?.website_url && (
               <a 
                 href={profileData.website_url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className={`p-2 rounded-lg border transition-all hover:-translate-y-1 ${
                   isDarkMode 
                     ? 'bg-[#222] border-gray-700 text-gray-400 hover:text-white hover:bg-[#333] hover:border-[#E50914]/50' 
                     : 'bg-white border-gray-200 text-gray-500 hover:text-[#E50914] hover:bg-gray-50 hover:border-[#E50914]/50'
                 }`}
                 title="Website"
               >
                 <Globe size={18} />
               </a>
             )}
             {profileData?.github_url && (
               <a 
                 href={profileData.github_url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className={`p-2 rounded-lg border transition-all hover:-translate-y-1 ${
                   isDarkMode 
                     ? 'bg-[#222] border-gray-700 text-gray-400 hover:text-white hover:bg-[#333] hover:border-[#E50914]/50' 
                     : 'bg-white border-gray-200 text-gray-500 hover:text-[#E50914] hover:bg-gray-50 hover:border-[#E50914]/50'
                 }`}
                 title="GitHub"
               >
                 <Github size={18} />
               </a>
             )}
             {profileData?.linkedin_url && (
               <a 
                 href={profileData.linkedin_url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className={`p-2 rounded-lg border transition-all hover:-translate-y-1 ${
                   isDarkMode 
                     ? 'bg-[#222] border-gray-700 text-gray-400 hover:text-white hover:bg-[#333] hover:border-[#E50914]/50' 
                     : 'bg-white border-gray-200 text-gray-500 hover:text-[#E50914] hover:bg-gray-50 hover:border-[#E50914]/50'
                 }`}
                 title="LinkedIn"
               >
                 <Linkedin size={18} />
               </a>
             )}
             {profileData?.twitter_url && (
               <a 
                 href={profileData.twitter_url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className={`p-2 rounded-lg border transition-all hover:-translate-y-1 ${
                   isDarkMode 
                     ? 'bg-[#222] border-gray-700 text-gray-400 hover:text-white hover:bg-[#333] hover:border-[#E50914]/50' 
                     : 'bg-white border-gray-200 text-gray-500 hover:text-[#E50914] hover:bg-gray-50 hover:border-[#E50914]/50'
                 }`}
                 title="Twitter"
               >
                 <Twitter size={18} />
               </a>
             )}
             {profileData?.instagram_url && (
               <a 
                 href={profileData.instagram_url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className={`p-2 rounded-lg border transition-all hover:-translate-y-1 ${
                   isDarkMode 
                     ? 'bg-[#222] border-gray-700 text-gray-400 hover:text-white hover:bg-[#333] hover:border-[#E50914]/50' 
                     : 'bg-white border-gray-200 text-gray-500 hover:text-[#E50914] hover:bg-gray-50 hover:border-[#E50914]/50'
                 }`}
                 title="Instagram"
               >
                 <Instagram size={18} />
               </a>
             )}
             {profileData?.whatsapp_url && (
               <a 
                 href={`https://wa.me/${profileData.whatsapp_url.replace(/[^0-9]/g, '')}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className={`p-2 rounded-lg border transition-all hover:-translate-y-1 ${
                   isDarkMode 
                     ? 'bg-[#222] border-gray-700 text-gray-400 hover:text-white hover:bg-[#333] hover:border-[#E50914]/50' 
                     : 'bg-white border-gray-200 text-gray-500 hover:text-[#E50914] hover:bg-gray-50 hover:border-[#E50914]/50'
                 }`}
                 title="WhatsApp"
               >
                 <MessageCircle size={18} />
               </a>
             )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-[#F4A261] to-[#E50914] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95">
            Connect
          </button>
          <button className={`flex-1 md:flex-none px-6 py-2.5 border rounded-xl font-bold text-sm transition-all active:scale-95 ${isDarkMode ? 'bg-[#222] border-gray-700 text-white hover:bg-[#333]' : 'bg-white border-gray-200 text-black hover:bg-gray-50'}`}>
            Message
          </button>
          {isFromNav && (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2.5 border rounded-xl transition-all ${isDarkMode ? 'bg-[#222] border-gray-700 text-gray-400 hover:bg-[#333]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                <MoreHorizontal size={20} />
              </button>
              
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsMenuOpen(false)}
                  ></div>
                  <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border z-20 py-2 animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
                    <Link 
                      href="/settings" 
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-[#222] hover:text-[#E50914]' : 'text-gray-700 hover:bg-gray-50 hover:text-[#E50914]'}`}
                    >
                      <Edit size={16} />
                      Edit Details
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
