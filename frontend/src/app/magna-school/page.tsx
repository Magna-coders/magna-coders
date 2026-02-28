"use client";

import React, { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import LeftPanel from '@/components/LeftPanel';
import MobileDrawer from '@/components/MobileDrawer';
import CategoryFilter from '@/components/CategoryFilter';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import Checkout from '@/components/Checkout';
import { COURSES, CATEGORIES } from './constants';

export default function MagnaSchoolPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Magna School');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiUrl || !token) return;

        const response = await fetch(`${apiUrl}/integrations/payments/methods`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const methods = Array.isArray(data) ? data : (data.data || []);
          if (methods.length > 0) {
            setPaymentMethods(methods);
            console.log('MagnaSchool - Fetched payment methods:', methods);
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment methods in MagnaSchool', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  const filteredCourses = COURSES.filter(course => {
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        
        {selectedCourse && (
          <Checkout 
            amount={selectedCourse.price}
            itemTitle={selectedCourse.title}
            itemDescription={`Instructor: ${selectedCourse.instructor}`}
            onClose={() => setSelectedCourse(null)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* HEADER */}
        <TopNavigation 
          title="Magna School" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          className="md:!left-0 lg:!left-0"
          searchPlaceholder="Search courses, mentors, skills..."
          isDarkMode={isDarkMode}
        />

        {/* CONTENT */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 overflow-y-auto pt-[65px] md:pt-[71px]">
          
          {/* Categories */}
          <CategoryFilter 
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            isDarkMode={isDarkMode}
          />

          {/* Course Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <CourseCard 
                key={course.id}
                course={course}
                isDarkMode={isDarkMode}
                onSelect={() => setSelectedCourse(course)}
              />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <EmptyState />
          )}

        </div>

        {/* MOBILE DRAWER */}
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
