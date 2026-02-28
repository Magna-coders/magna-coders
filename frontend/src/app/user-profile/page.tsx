"use client";

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import LeftPanel from '@/components/LeftPanel';
import MobileDrawer from '@/components/MobileDrawer';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileTabs from '@/components/ProfileTabs';
import OverviewTab from '@/components/OverviewTab';
import SkillsTab from '@/components/SkillsTab';
import UserProjectsTab from '@/components/UserProjectsTab';
import ActivitiesTab from '@/components/ActivitiesTab';
import ConnectionsTab from '@/components/ConnectionsTab';
import UserPostsTab from '@/components/UserPostsTab';
import { USER_DATA, PROFILE_TABS } from './data';
import { getUserPosts, Post } from '@/services/posts';
import { getFriends, Friend } from '@/services/friends';

function UserProfileContent() {
  const router = require('next/navigation').useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [router]);
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [userData, setUserData] = useState(USER_DATA);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userFriends, setUserFriends] = useState<Friend[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const searchParams = useSearchParams();
  const isFromNav = searchParams?.get('from') === 'nav';
  const profileUserId = searchParams?.get('id');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = profileUserId || localStorage.getItem('userId') || localStorage.getItem('userid');
        if (userId) {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/profile/${userId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            const profileData = result.data || result;
            
            setUserData(prevData => ({
              ...prevData,
              name: profileData.username || profileData.email?.split('@')[0] || prevData.name,
              username: profileData.username ? `@${profileData.username}` : (profileData.email ? `@${profileData.email.split('@')[0]}` : prevData.username),
              role: profileData.role || prevData.role,
              location: profileData.location || prevData.location,
              bio: profileData.bio || prevData.bio,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, [profileUserId]);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      setLoadingPosts(true);
      try {
        const userId = profileUserId || localStorage.getItem('userId') || localStorage.getItem('userid');
        if (userId) {
          const posts = await getUserPosts(userId, { limit: 20 });
          setUserPosts(posts);
        }
      } catch (error) {
        console.error('Failed to fetch user posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchUserPosts();
  }, [profileUserId]);

  // Fetch user friends
  useEffect(() => {
    const fetchUserFriends = async () => {
      setLoadingFriends(true);
      try {
        const userId = profileUserId || localStorage.getItem('userId') || localStorage.getItem('userid');
        if (userId) {
          const friends = await getFriends(userId);
          setUserFriends(friends);
        }
      } catch (error) {
        console.error('Failed to fetch user friends:', error);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchUserFriends();
  }, [profileUserId]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      {/* LEFT PANEL (Desktop) */}
      <div className={`w-[240px] border-r hidden md:block flex-shrink-0 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
         <div className="p-6 h-full overflow-y-auto">
            <LeftPanel 
               activeTab={activeTab} 
               setActiveTab={setActiveTab}
               isDarkMode={isDarkMode}
               toggleTheme={toggleTheme}
            />
         </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP NAVIGATION BAR */}
        <TopNavigation 
          title="Profile" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          className="md:!left-0 lg:!left-0"
          isDarkMode={isDarkMode}
        />

        {/* MOBILE DRAWER */}
        <MobileDrawer 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isDarkMode={isDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleTheme={toggleTheme}
        />

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pt-[90px] md:pt-[71px]">
            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-32 md:pb-8">
                
                {/* 1. PROFILE HEADER CARD */}
                <ProfileHeader 
                  user={userData} 
                  isDarkMode={isDarkMode} 
                  isFromNav={isFromNav} 
                />

                {/* 2. TABS NAVIGATION */}
                <ProfileTabs 
                  tabs={PROFILE_TABS} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  isDarkMode={isDarkMode} 
                />

                {/* 3. TAB CONTENT */}
                <div className="min-h-[300px]">
                    {activeTab === 'Overview' && (
                      <OverviewTab user={userData} isDarkMode={isDarkMode} />
                    )}

                    {activeTab === 'Skills' && (
                      <SkillsTab isDarkMode={isDarkMode} isOwnProfile={!profileUserId || profileUserId === (localStorage.getItem('userId') || localStorage.getItem('userid'))} />
                    )}

                    {activeTab === 'Projects' && (
                      <UserProjectsTab 
                        isDarkMode={isDarkMode} 
                        isOwnProfile={!profileUserId || profileUserId === (localStorage.getItem('userId') || localStorage.getItem('userid'))}
                        userId={profileUserId || undefined}
                      />
                    )}

                    {activeTab === 'Activities' && (
                      <UserPostsTab 
                        posts={userPosts} 
                        loading={loadingPosts}
                        isDarkMode={isDarkMode} 
                      />
                    )}

                    {activeTab === 'Connections' && (
                      <ConnectionsTab 
                        connections={userFriends.map(friend => ({
                          name: friend.username,
                          role: friend.bio || 'Developer',
                          avatar: friend.avatar_url
                        }))} 
                        isDarkMode={isDarkMode} 
                      />
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#FDF8F5] flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#E50914] rounded-full animate-spin"></div></div>}>
      <UserProfileContent />
    </Suspense>
  );
}
