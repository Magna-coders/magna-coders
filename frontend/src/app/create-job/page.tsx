"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import MobileDrawer from '@/components/MobileDrawer';
import PageHeader from '@/components/PageHeader';
import JobForm from '@/components/JobForm';
import { useSearchParams } from 'next/navigation';

function CreateJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Jobs');
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
        title="Post Job" 
        onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
        isDarkMode={isDarkMode}
      />

      {/* MOBILE DRAWER */}
      <MobileDrawer 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

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
      <div className="flex-1 flex flex-col h-full overflow-hidden relative pt-[65px] md:pt-[71px]">
        
        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="max-w-2xl mx-auto p-4 md:p-8">
            
            {/* HEADER */}
            <PageHeader 
              title="Post Job Opportunity" 
              description="Find the best talent for your team" 
              onBack={() => router.back()} 
              isDarkMode={isDarkMode} 
            />

            {/* FORM */}
            <JobForm 
              isDarkMode={isDarkMode} 
              onCancel={() => router.back()} 
              onSuccess={handleSuccess}
              jobId={searchParams?.get('editId') || undefined}
            />
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateJobPage() {
  return (
    <Suspense fallback={null}>
      <CreateJobContent />
    </Suspense>
  );
}
