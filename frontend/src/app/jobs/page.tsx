"use client";

import React, { useState, useEffect } from 'react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import JobCard, { Job } from '@/components/JobCard';
import { listOpportunities } from '@/services/opportunities';
import TabFilters from '@/components/TabFilters';
import JobPageHeader from '@/components/JobPageHeader';
import MobileDrawer from '@/components/MobileDrawer';

export default function JobsPage() {
  const router = require('next/navigation').useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [router]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Opportunities');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    // Dispatch event for other components
    window.dispatchEvent(new Event('themeChanged'));
  };

  // Jobs fetched from backend
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchJobs() {
      setLoadingJobs(true);
      try {
        // Fetch all opportunities and bookmarked jobs in parallel
        const [opportunitiesRes, bookmarksRes] = await Promise.all([
          listOpportunities({ limit: 20 }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookmarks/me`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }).then(r => r.ok ? r.json() : { bookmarks: [] }).catch(() => ({ bookmarks: [] }))
        ]);

        const items = opportunitiesRes.items || [];
        const bookmarkedIds = new Set((bookmarksRes.bookmarks || []).map((b: any) => b.opportunity_id));
        
        // Check both userId and userid for compatibility
        const localUserId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('userid')) : null;
        
        const mapped: Job[] = items.map((opportunity: any, idx: number) => {
          const companyName = opportunity.company?.name || opportunity.company || 'Company';
          const salary = opportunity.salary_min && opportunity.salary_max
            ? `${opportunity.currency || ''} ${opportunity.salary_min} - ${opportunity.salary_max}`.trim()
            : (opportunity.salary_text || 'Competitive');
          const isBookmarked = bookmarkedIds.has(opportunity.id);
          
          return {
            id: Number(opportunity.id) || idx + 1,
            title: opportunity.title || 'Untitled',
            company: companyName,
            location: opportunity.location ? `${opportunity.location.city || ''}${opportunity.location.region ? ', ' + opportunity.location.region : ''}`.trim() : 'Remote',
            type: opportunity.employment_type || opportunity.job_type || 'Full-time',
            salary,
            postedAt: opportunity.posted_at || opportunity.created_at || '',
            description: opportunity.short_description || (opportunity.description ? String(opportunity.description).replace(/<[^>]+>/g, '') : ''),
            tags: opportunity.skills || [],
            logoColor: 'bg-gray-500',
            category: isBookmarked ? 'saved' : 'recommended',
            isExpired: opportunity.status === 'closed',
            isOwner: !!(localUserId && (
              String(opportunity.owner_user_id || opportunity.author_id || opportunity.author?.id || '') === String(localUserId)
            )),
            opportunityId: opportunity.id,
            isBookmarked
          } as Job;
        });
        
        if (mounted) setAllJobs(mapped);
      } catch (err: any) {
        if (mounted) setJobsError(err?.message || 'Failed to load jobs');
      } finally {
        if (mounted) setLoadingJobs(false);
      }
    }
    fetchJobs();
    return () => { mounted = false; };
  }, []);

  const tabs = ['All jobs', 'Recommended for you', 'Saved jobs'];
  const [activeFilterTab, setActiveFilterTab] = useState('All jobs');

  const filteredJobs = allJobs.filter(job => {
    const matchesCategory = 
      activeFilterTab === 'All jobs' ? true :
      activeFilterTab === 'Recommended for you' ? job.category === 'recommended' :
      activeFilterTab === 'Saved jobs' ? job.category === 'saved' : true;
    
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
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
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300`}>
        
        {/* TOP NAVIGATION BAR */}
        <TopNavigation 
          title="Jobs" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          searchPlaceholder="Search jobs, companies, skills..."
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          isDarkMode={isDarkMode}
        />

        {/* MOBILE DRAWER */}
        <MobileDrawer 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isDarkMode={isDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleTheme={toggleTheme}
        />

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pt-[65px] md:pt-[80px]">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            
            {/* HEADER */}
            <JobPageHeader isDarkMode={isDarkMode} />

            {/* TABS */}
            <TabFilters 
              tabs={tabs} 
              activeTab={activeFilterTab} 
              onTabChange={setActiveFilterTab} 
              isDarkMode={isDarkMode} 
            />

            {/* JOBS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loadingJobs && <div className="col-span-full text-center py-8">Loading jobs...</div>}
              {jobsError && <div className="col-span-full text-center text-red-500 py-8">{jobsError}</div>}
              {!loadingJobs && !jobsError && filteredJobs.map(job => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  isDarkMode={isDarkMode} 
                  showExpiration={activeFilterTab === 'Saved jobs' && job.category === 'saved'} 
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
