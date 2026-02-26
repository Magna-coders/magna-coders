'use client';

import React, { useState, useEffect } from 'react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import MobileDrawer from '@/components/MobileDrawer';
import PodcastHero from '@/components/PodcastHero';
import PodcastFilter from '@/components/PodcastFilter';
import PodcastCard from '@/components/PodcastCard';
import PodcastPlayer from '@/components/PodcastPlayer';
import { PODCASTS } from './constants';

export default function MagnaPodcastPage() {
  const [activeTab, setActiveTab] = useState('Magna Podcast');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  const togglePlay = (id: number) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  const currentPodcast = playingId ? PODCASTS.find(p => p.id === playingId) : null;

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      {/* LEFT SIDEBAR */}
      <LeftPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 min-w-0 w-full md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} p-4 pt-24 md:p-8 md:pt-24 max-w-7xl mx-auto transition-all duration-300 pb-24 md:pb-8 relative`}>
        
        {/* TOP NAVIGATION BAR */}
        <TopNavigation 
          title="Magna Podcast" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          className={`md:left-[88px] ${isSidebarExpanded ? 'lg:left-[260px]' : 'lg:left-[88px]'}`}
          isDarkMode={isDarkMode}
          showSearch={true}
          searchPlaceholder="Search episodes..."
        />

        {/* MOBILE DRAWER (Left Sidebar Content) */}
        <MobileDrawer 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isDarkMode={isDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleTheme={toggleTheme}
        />

        {/* HERO SECTION - JOIN PODCAST */}
        <PodcastHero isDarkMode={isDarkMode} />

        {/* FILTERS & TITLE */}
        <PodcastFilter isDarkMode={isDarkMode} />

        {/* PODCAST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {PODCASTS.map((podcast) => (
            <PodcastCard 
              key={podcast.id}
              podcast={podcast}
              isPlaying={playingId === podcast.id}
              onTogglePlay={togglePlay}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>

        {/* PODCAST PLAYER */}
        {currentPodcast && (
          <PodcastPlayer 
            podcast={currentPodcast}
            isPlaying={true}
            onTogglePlay={() => setPlayingId(null)}
            onClose={() => setPlayingId(null)}
            isDarkMode={isDarkMode}
          />
        )}

      </main>
    </div>
  );
}
