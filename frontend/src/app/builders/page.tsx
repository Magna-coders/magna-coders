"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X
} from 'lucide-react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import BuilderCard, { Builder } from '@/components/BuilderCard';
import Pagination from '@/components/Pagination';

const LOOKING_FOR_OPTIONS = [
  'Team Member',
  'Accountability Partner',
  'Mentor',
  'Networking & Opportunities',
  'Investment Prospect',
  'Technical Co-founder',
  'Design Assistance',
  'UI/UX and product design'
];

// Mock Data for Builders
const MOCK_BUILDERS: Builder[] = Array.from({ length: 50 }).map((_, i) => {
  // Randomly select 1-3 looking for options
  const numLookingFor = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...LOOKING_FOR_OPTIONS].sort(() => 0.5 - Math.random());
  const lookingFor = shuffled.slice(0, numLookingFor);

  return {
    id: i + 1,
    name: i % 2 === 0 ? 'Ashwa' : 'abdijabar',
    email: i % 2 === 0 ? 'ashwaashard@gmail.com' : 'abdijabarmadeyteno@gmail.com',
    bio: i % 2 === 0 
      ? 'Ux Ui designer| Author | Deep Thinker | Content Creator | Artist 🎨 💻 📽️' 
      : 'Great mind with ambitions, flowing with destiny with submission.',
    roles: i % 2 === 0 
      ? ['UX Designer', 'Designer'] 
      : ['AI/ML Engineer', 'Backend Developer', 'Developer', 'Research/Analyst'],
    lookingFor,
    location: i % 2 === 0 ? 'Nairobi' : 'Mandera, Kenya (Home Address)',
    status: 'available',
    connected: i % 3 === 0,
    avatar: null // Will use initials or placeholder
  };
});

export default function BuildersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Members');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const itemsPerPage = 6; // Grid 3x2 or List
  
  const totalPages = Math.ceil(MOCK_BUILDERS.length / itemsPerPage);
  const currentBuilders = MOCK_BUILDERS.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`min-h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      {/* LEFT SIDEBAR */}
      <LeftPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col h-screen overflow-y-auto pt-24 relative md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300`}>
        
        {/* TOP NAVIGATION BAR (Reused) */}
        <TopNavigation 
          title="Builders" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          className={`md:left-[88px] ${isSidebarExpanded ? 'lg:left-[260px]' : 'lg:left-[88px]'}`}
          searchPlaceholder="Search by name, category, role, location..."
          isDarkMode={isDarkMode}
        />

        {/* MOBILE DRAWER (Left Sidebar Content) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            
            {/* Drawer Content */}
            <div className={`absolute top-0 left-0 w-full h-full shadow-2xl flex flex-col overflow-y-auto animate-slide-in-left ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
              <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${isDarkMode ? 'bg-black border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
                <Link href="/" className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#E50914]">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                   </div>
                   <span className="text-lg font-bold tracking-tight">
                      <span className="text-[#F4A261]">Magna</span>
                      <span className="text-[#E50914]">Coders</span>
                   </span>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="p-4 space-y-6 pb-20">
                <LeftPanel 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  closeMenu={() => setIsMobileMenuOpen(false)} 
                  isMobile={true}
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                />
              </div>
            </div>
          </div>
        )}

        {/* BUILDERS GRID / LIST */}
        <div className="px-4 md:px-10 py-8 pb-24 md:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentBuilders.map((builder) => (
              <BuilderCard 
                key={builder.id} 
                builder={builder} 
                isDarkMode={isDarkMode} 
              />
            ))}
          </div>

          {/* Pagination (Mobile & Desktop) */}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isDarkMode={isDarkMode}
          />
        </div>

      </div>

    </div>
  );
}
