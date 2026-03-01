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
import { CurriculumSection } from './constants';

const COURSE_DETAILS = {
  1: {
    id: 1,
    title: 'Full Stack Development',
    description: 'Master frontend and backend development with modern tools.',
    category: 'Web Development',
    level: 'Intermediate',
    lastUpdated: '2024-01-15',
    features: ['Lifetime Access', 'Certificate', 'Community Access'],
    instructor: {
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
      rating: 4.8,
      students: 1234,
      courses: 5,
      bio: 'Experienced full-stack developer with 10+ years of experience.',
      role: 'Senior Developer'
    },
    price: 99.99,
    rating: 4.8,
    students: 1234,
    lessons: 45,
    duration: '12h 30m',
    image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    curriculum: [
      { title: 'Introduction', duration: '30m', videos: 3, lessons: [
        { title: 'Course Overview', duration: '10m', type: 'video' as const, isFree: true },
        { title: 'Setup Environment', duration: '15m', type: 'video' as const, isFree: false },
        { title: 'Project Structure', duration: '5m', type: 'video' as const, isFree: false }
      ]},
      { title: 'Frontend Basics', duration: '2h', videos: 8, lessons: [
        { title: 'HTML & CSS Fundamentals', duration: '30m', type: 'video' as const, isFree: false },
        { title: 'JavaScript Basics', duration: '45m', type: 'video' as const, isFree: false },
        { title: 'React Components', duration: '40m', type: 'video' as const, isFree: false }
      ]},
      { title: 'Backend API', duration: '3h', videos: 12, lessons: [
        { title: 'Node.js Setup', duration: '20m', type: 'video' as const, isFree: false },
        { title: 'Express Routes', duration: '45m', type: 'video' as const, isFree: false },
        { title: 'Database Connection', duration: '30m', type: 'video' as const, isFree: false }
      ]}
    ] as CurriculumSection[],
    whatYouWillLearn: [
      'React and Next.js',
      'Node.js and Express',
      'Database Design'
    ]
  },
  2: {
    id: 2,
    title: 'Advanced React Patterns',
    description: 'Take your React skills to the next level.',
    category: 'Web Development',
    level: 'Advanced',
    lastUpdated: '2024-02-20',
    features: ['Lifetime Access', 'Certificate', 'Community Access'],
    instructor: {
      name: 'Jane Smith',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      students: 850,
      courses: 3,
      bio: 'React expert with 8+ years of experience in frontend development.',
      role: 'Senior Frontend Developer'
    },
    price: 79.99,
    rating: 4.9,
    students: 850,
    lessons: 30,
    duration: '8h 15m',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    curriculum: [
      { title: 'Hooks Deep Dive', duration: '1h', videos: 5, lessons: [
        { title: 'useState Hook', duration: '15m', type: 'video' as const, isFree: false },
        { title: 'useEffect Hook', duration: '20m', type: 'video' as const, isFree: false },
        { title: 'Custom Hooks', duration: '25m', type: 'video' as const, isFree: false }
      ]},
      { title: 'Performance Optimization', duration: '2h', videos: 8, lessons: [
        { title: 'Memo and Callback', duration: '30m', type: 'video' as const, isFree: false },
        { title: 'Lazy Loading', duration: '45m', type: 'video' as const, isFree: false },
        { title: 'Bundle Optimization', duration: '45m', type: 'video' as const, isFree: false }
      ]}
    ] as CurriculumSection[],
    whatYouWillLearn: [
      'Custom Hooks',
      'Context API',
      'Render Props'
    ]
  }
};

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
