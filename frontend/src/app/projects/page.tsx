"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutGrid, Users, MessageCircleQuestion, Settings, 
  Menu, X, FolderKanban, Plus, Search, 
  MessageSquare, LayoutDashboard, Bell, Calendar, MapPin,
  Sun, Moon
} from 'lucide-react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';

import { apiFetch } from '@/services/apiClient';

export default function ProjectsPage() {

  const router = require('next/navigation').useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Projects');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabs = ['All projects', 'Search trending projects', 'Completed projects'];
  const [activeFilterTab, setActiveFilterTab] = useState('All projects');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError(null);
      try {
        const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
        const data = await apiFetch<{ projects: any[] }>(`/projects${params}`);
        setProjects(data.projects || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [searchQuery]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
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
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300`}>
        
        {/* TOP NAVIGATION BAR */}
        <TopNavigation 
          title="Projects" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          searchPlaceholder="Search projects, stacks, categories..."
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          isDarkMode={isDarkMode}
        />

        {/* MOBILE DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            
            <div className={`absolute top-0 left-0 w-full h-full shadow-2xl flex flex-col overflow-y-auto animate-slide-in-left ${
              isDarkMode ? 'bg-black border-r border-[#E70008]/20' : 'bg-white'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${
                isDarkMode ? 'bg-black border-[#E70008]/20' : 'bg-white border-gray-100'
              }`}>
                <Link href="/" className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-[#E70008] flex items-center justify-center shadow-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                   </div>
                   <span className="text-lg font-bold tracking-tight">
                      <span className="text-[#F4A261]">Magna</span>
                      <span className="text-[#E70008]">Coders</span>
                   </span>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-full hover:bg-gray-100 ${isDarkMode ? 'text-gray-400 hover:bg-[#E70008]/10' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <X size={24} />
                </button>
              </div>

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

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pt-[65px] md:pt-[80px]">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>My Projects</h1>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Manage and create your collaborative projects</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Link href="/create-project" className="flex items-center justify-center gap-2 px-6 py-3 bg-[#E50914] text-white rounded-xl font-bold shadow-md hover:bg-[#cc0812] transition-all active:scale-95">
                  <Plus size={20} />
                  <span>Create New Project</span>
                </Link>
              </div>
            </div>

            {/* TABS */}
            <div className={`flex items-center gap-6 border-b mb-8 overflow-x-auto no-scrollbar ${
              isDarkMode ? 'border-[#E70008]/20' : 'border-gray-200'
            }`}>
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilterTab(tab)}
                  className={`pb-4 px-2 text-sm font-bold whitespace-nowrap relative transition-colors ${
                    activeFilterTab === tab 
                      ? 'text-[#E50914]' 
                      : isDarkMode ? 'text-gray-500 hover:text-[#F9E4AD]' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                  {activeFilterTab === tab && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E50914] rounded-t-full shadow-[0_0_10px_rgba(231,0,8,0.8)]"></span>
                  )}
                </button>
              ))}
            </div>

            {/* PROJECTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-center py-12 text-lg">Loading projects...</div>
              ) : error ? (
                <div className="col-span-2 text-center py-12 text-red-500">{error}</div>
              ) : projects.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-400">No projects found.</div>
              ) : (
                projects.map(project => (
                  <Link href={`/projects/${project.id}`} key={project.id} className="block">
                    <div className={`rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all group ${
                      isDarkMode 
                        ? 'bg-[#111] border-[#E70008]/30 shadow-[0_0_15px_rgba(231,0,8,0.1)]' 
                        : 'bg-white border-gray-100'
                    }`}>
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <h2 className={`text-xl font-bold transition-colors group-hover:text-[#E50914] ${
                          isDarkMode ? 'text-[#F9E4AD]' : 'text-black'
                        }`}>
                          {project.name || project.title}
                        </h2>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            project.status === 'in-progress' 
                              ? isDarkMode ? 'bg-[#E70008]/10 text-[#E70008] border-[#E70008]/30' : 'bg-[#E50914]/5 text-[#E50914] border-[#E50914]/20'
                              : project.status === 'open' 
                                ? isDarkMode ? 'bg-[#FF9940]/10 text-[#FF9940] border-[#FF9940]/30' : 'bg-[#F4A261]/10 text-[#d98236] border-[#F4A261]/20'
                                : isDarkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            {project.status || 'open'}
                          </span>
                          {project.level && (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isDarkMode ? 'bg-[#222] text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                              {project.level}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className={`text-sm mb-6 leading-relaxed ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {project.description}
                      </p>

                      {/* Category */}
                      {project.category && (
                        <div className="mb-6">
                          <span className={`text-xs font-bold uppercase tracking-wider mb-2 block ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>Category</span>
                          <span className={`text-sm font-bold ${
                            isDarkMode ? 'text-[#FF9940]' : 'text-[#F4A261]'
                          }`}>{project.category}</span>
                        </div>
                      )}

                      {/* Tech Stack */}
                      {project.techStack && Array.isArray(project.techStack) && (
                        <div className="mb-6">
                          <span className={`text-xs font-bold uppercase tracking-wider mb-2 block ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>Tech Stack</span>
                          <div className="flex flex-wrap gap-2">
                            {project.techStack.map((tech: string) => (
                              <span key={tech} className={`px-2 py-1 rounded-md text-xs font-medium border ${
                                isDarkMode 
                                  ? 'bg-[#222] text-gray-300 border-gray-800' 
                                  : 'bg-gray-50 text-gray-600 border-gray-100'
                              }`}>
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className={`flex items-center justify-between text-xs font-medium mb-6 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span>{project.teamCount || (project.members ? project.members.length : 0)} members</span>
                          </div>
                          {project.location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} />
                              <span>{project.location}</span>
                            </div>
                          )}
                        </div>
                        {project.date && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{project.date}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        <button className="flex-1 py-2.5 bg-[#E50914] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#cc0812] transition-colors">
                          Edit
                        </button>
                        <button className={`flex-1 py-2.5 border rounded-xl font-bold text-sm transition-colors ${
                          isDarkMode 
                            ? 'bg-transparent border-[#E70008]/40 text-[#F9E4AD] hover:bg-[#E70008]/10' 
                            : 'bg-white border-gray-200 text-black hover:bg-gray-50'
                        }`}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
