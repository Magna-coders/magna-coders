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
import { getUsers, User } from '@/services/users';

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

export default function BuildersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Members');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

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

  // Fetch users from backend
  useEffect(() => {
    const fetchBuilders = async () => {
      setLoading(true);
      try {
        console.log('Fetching builders from backend...');
        const response = await getUsers({ page: currentPage, limit: itemsPerPage });
        console.log('Received response:', response);
        
        // Map backend users to Builder format
        const mappedBuilders: Builder[] = response.users.map((user: User) => {
          console.log('Mapping user:', user.username, user.email);
          return {
            id: user.id, // Keep the actual UUID
            name: user.username,
            email: user.email,
            bio: user.bio || 'No bio available',
            roles: ['Developer'], // Default role, can be enhanced later
            lookingFor: ['Networking & Opportunities'], // Default, can be enhanced later
            location: user.location || 'Location not specified',
            status: 'available',
            connected: false,
            avatar: user.avatar_url || null,
            github_url: user.github_url || null,
            linkedin_url: user.linkedin_url || null,
            portfolio_url: user.portfolio_url || null,
            whatsapp_url: user.whatsapp_url || null
          };
        });

        console.log('Mapped builders:', mappedBuilders.length);
        setBuilders(mappedBuilders);
        setTotalPages(response.pagination.totalPages);
      } catch (error: any) {
        console.error('Failed to fetch builders:', error);
        console.error('Error details:', error.message);
        setBuilders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuilders();
  }, [currentPage]);

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
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#E50914] rounded-full animate-spin"></div>
            </div>
          ) : builders.length === 0 ? (
            <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-lg font-medium mb-2">No builders found</p>
              <p className="text-sm">Check back later for new members!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {builders.map((builder) => (
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
            </>
          )}
        </div>

      </div>

    </div>
  );
}
