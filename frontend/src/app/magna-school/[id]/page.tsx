"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import MobileDrawer from '@/components/MobileDrawer';
import CourseHeader from '@/components/CourseHeader';
import VideoPreview from '@/components/VideoPreview';
import WhatYouWillLearn from '@/components/WhatYouWillLearn';
import CourseCurriculum from '@/components/CourseCurriculum';
import InstructorBio from '@/components/InstructorBio';
import EnrollmentCard from '@/components/EnrollmentCard';

import { COURSE_DETAILS } from './constants';

export default function CourseDetailPage() {
  const params = useParams();
  // Default to course 1 if not found or for demo
  const courseId = params?.id ? Number(params.id) : 1; 
  const course = COURSE_DETAILS[courseId as unknown as keyof typeof COURSE_DETAILS] ?? COURSE_DETAILS[1];
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Magna School'); // Add activeTab state
  const [isDarkMode, setIsDarkMode] = useState(false); // Add isDarkMode state (you might want to sync this with context or local storage as in other pages)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

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

  const totalVideos = course.curriculum.reduce((acc, section) => acc + section.videos, 0);

  return (
    <div className={`min-h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      {/* DESKTOP SIDEBAR */}
      <LeftPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col h-screen overflow-y-auto md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300`}>
        {/* Header */}
        <TopNavigation 
          title="Magna School" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          className={`md:left-[88px] ${isSidebarExpanded ? 'lg:left-[260px]' : 'lg:left-[88px]'}`}
          isDarkMode={isDarkMode}
        />

        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-4 flex items-center justify-between gap-4 mt-16 md:mt-0">
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
             <Link href="/magna-school" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 shrink-0">
               <ChevronLeft size={24} />
             </Link>
             <h1 className="font-bold text-lg line-clamp-1">{course.title}</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 md:pb-8">
        
        {/* Left Column: Video & Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Video Player Placeholder */}
          <VideoPreview isDarkMode={isDarkMode} />

          {/* Course Header Info */}
          <CourseHeader course={course} isDarkMode={isDarkMode} />

          {/* What you'll learn */}
          <WhatYouWillLearn isDarkMode={isDarkMode} />

          {/* Course Content / Syllabus */}
          <CourseCurriculum 
            curriculum={course.curriculum} 
            totalVideos={totalVideos}
            totalDuration={course.duration}
            isDarkMode={isDarkMode}
          />
          
          {/* Instructor Bio */}
          <InstructorBio instructor={course.instructor} isDarkMode={isDarkMode} />

        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="lg:col-span-1">
           <div className="sticky top-24 space-y-6">
             {/* Preview/Enroll Card */}
             <EnrollmentCard course={course} isDarkMode={isDarkMode} />

             {/* Business Card */}
             <div className="bg-black rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-bold text-lg mb-2">Training 5 or more people?</h4>
                  <p className="text-sm text-gray-400 mb-4">Get your team access to Magna School&apos;s top 5,000+ courses anytime, anywhere.</p>
                  <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                    Get Magna Business
                  </button>
                </div>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#E50914] rounded-full blur-2xl opacity-50"></div>
             </div>
           </div>
        </div>

        </div>

        {/* MOBILE DRAWER (Left Sidebar Content) */}
        <MobileDrawer 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isDarkMode={isDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleTheme={toggleTheme}
        />

      </div>
    </div>
  );
}
