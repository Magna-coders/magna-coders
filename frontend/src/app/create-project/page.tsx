"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftPanel from '@/components/LeftPanel';
import MobileDrawer from '@/components/MobileDrawer';
import ProjectForm from '@/components/ProjectForm';
import { ArrowLeft } from 'lucide-react';
import TopNavigation from '@/components/TopNavigation';

export default function CreateProjectPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Projects'); // For LeftPanel state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
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

  const handleSuccess = () => {
    router.push('/feed');
  };

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      {/* TOP NAVIGATION BAR */}
      <TopNavigation 
        title="Create Project" 
        onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
        isDarkMode={isDarkMode}
      />

      {/* LEFT SIDEBAR (Reused from Feed) */}
      <LeftPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative pt-[65px] md:pt-[71px] md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300`}>
        
        {/* MOBILE DRAWER */}
        <MobileDrawer 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="max-w-2xl mx-auto p-4 md:p-8">
            
            {/* HEADER */}
            <div className="mb-8">
              <button 
                onClick={() => router.back()} 
                className={`flex items-center gap-2 transition-colors mb-4 md:hidden ${isDarkMode ? 'text-gray-400 hover:text-[#E50914]' : 'text-gray-500 hover:text-[#E50914]'}`}
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-bold">Back</span>
              </button>
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Create New Project</h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Share your idea and find the perfect team</p>
            </div>

            {/* FORM */}
            <ProjectForm 
              onCancel={() => router.push('/my-projects')}
              isDarkMode={isDarkMode}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
