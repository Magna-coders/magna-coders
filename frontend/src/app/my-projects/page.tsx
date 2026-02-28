"use client";

import React, { useState, useEffect } from 'react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import MobileDrawer from '@/components/MobileDrawer';
import ProjectListHeader from '@/components/ProjectListHeader';
import TabFilters from '@/components/TabFilters';
import ProjectCard from '@/components/ProjectCard';
import { PROJECTS, PROJECT_TABS } from './constants';
import { TRENDING_PROJECTS } from '../projects/data';

export default function MyProjectsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('All projects');
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

  // Determine which projects to display based on active tab
  const displayProjects = activeFilterTab === 'Search new projects' ? TRENDING_PROJECTS : PROJECTS;

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      {/* LEFT SIDEBAR */}
      <LeftPanel 
        activeTab="Projects"
        setActiveTab={() => {}} // No-op since we are on the projects page
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 min-w-0 w-full md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300 relative flex flex-col h-screen`}>
        
        {/* TOP NAVIGATION BAR */}
        <TopNavigation 
          title="My Projects"
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          className={`md:left-[88px] ${isSidebarExpanded ? 'lg:left-[260px]' : 'lg:left-[88px]'}`}
          showSearch={false}
          showBack={false}
          isDarkMode={isDarkMode}
        />

        {/* MOBILE DRAWER */}
        <MobileDrawer 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isDarkMode={isDarkMode}
          activeTab="Projects"
          setActiveTab={() => {}}
          toggleTheme={toggleTheme}
        />

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pt-[72px] md:pt-[88px]">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            
            {/* HEADER */}
            <ProjectListHeader 
              title={activeFilterTab === 'Search new projects' ? "Trending Projects" : "My Projects"}
              description={activeFilterTab === 'Search new projects' ? "Discover popular projects from the community" : "Manage and create your collaborative projects"}
              createLink="/create-project"
              createLabel="Create New Project"
            />

            {/* TABS */}
            <TabFilters 
              tabs={PROJECT_TABS}
              activeTab={activeFilterTab}
              onTabChange={setActiveFilterTab}
              isDarkMode={isDarkMode}
            />

            {/* PROJECTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              {displayProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  showActions={activeFilterTab !== 'Search new projects'} 
                />
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
