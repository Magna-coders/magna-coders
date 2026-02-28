'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFeed, getPosts } from '@/services/posts';
import type { Post as FeedPost } from '@/services/posts';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import Toast from '@/components/Toast';
import { formatTimeAgo } from '@/utils/timeFormat';
import FeedItem from '@/components/FeedItem';
import MobileDrawer from '@/components/MobileDrawer';
import InactiveAccountAlert from '@/components/InactiveAccountAlert';
import FeedFab from '@/components/FeedFab';
import FeedFilters from '@/components/FeedFilters';

export default function FeedPage() {
  const router = useRouter();
  // Auth check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [router]);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [showInactiveAlert, setShowInactiveAlert] = useState(true);
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = () => {
    setIsResending(true);
    // Simulate API call to resend verification email
    setTimeout(() => {
      setIsResending(false);
      showToast('Verification email has been resent to your inbox.');
    }, 1500);
  };

  useEffect(() => {
    console.log('Feed page mounted');
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

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Infinite Scroll State
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial Load
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        console.log('Fetching posts from backend with filter:', activeFilter);
        
        // Map filter to backend type
        let typeFilter: string | undefined;
        if (activeFilter === 'Projects') typeFilter = 'project';
        else if (activeFilter === 'Opportunities') typeFilter = 'job';
        else if (activeFilter === 'Posts') typeFilter = 'post';
        else if (activeFilter === 'Tech News') typeFilter = 'tech-news';
        // 'All' means no type filter
        
        const postsData = await getPosts({ 
          limit: 50, 
          offset: 0,
          type: typeFilter 
        });
        
        console.log('Successfully fetched posts:', postsData.length);
        console.log('Raw posts data:', JSON.stringify(postsData, null, 2));
        
        // Map backend data to component format
        const mappedPosts = postsData.map((post) => {
          const mapped = {
            id: post.id,
            type: (post.type?.toLowerCase() === 'regular' ? 'regular' : post.type?.toLowerCase()) || 'regular',
            author: {
              id: post.userId || post.user?.id,
              name: post.user?.username || post.author?.username || 'Unknown User',
              avatar: post.user?.profilePicture || post.author?.avatar_url,
              role: post.user?.verified ? 'Verified' : 'Member'
            },
            createdAt: formatTimeAgo(post.createdAt || post.created_at),
            likes: post.likesCount || post.likes || 0,
            comments: post.commentsCount || post.comments || 0,
            title: post.title,
            content: post.content,
            image: post.mediaUrls?.[0],
            company: post.company,
            description: post.projectDescription,
            location: post.location,
            salary: post.salary,
            tags: post.tags,
            jobType: post.jobType,
            summary: post.content || post.newsTitle, // Use content as summary for tech news
            source: post.newsSource,
            url: post.newsUrl,
            imageUrl: post.mediaUrls?.[0],
          };
          
          console.log(`Post ${post.id}:`, {
            hasMediaUrls: !!post.mediaUrls,
            mediaUrlsLength: post.mediaUrls?.length,
            firstMediaUrl: post.mediaUrls?.[0] ? `${post.mediaUrls[0].substring(0, 100)}...` : 'none',
            mappedImage: mapped.image ? `${mapped.image.substring(0, 100)}...` : 'none'
          });
          
          return mapped;
        });
        
        // Debug: Log image data
        mappedPosts.forEach((post, index) => {
          if (post.image) {
            console.log(`Post ${index} has image:`, {
              hasImage: !!post.image,
              imageType: post.image.startsWith('data:video/') ? 'video' : post.image.startsWith('data:image/') ? 'image' : 'unknown',
              imageLength: post.image.length,
              imagePrefix: post.image.substring(0, 50)
            });
          }
        });
        
        console.log('Mapped posts:', mappedPosts.length);
        
        // Deduplicate posts by ID
        const uniquePosts = mappedPosts.filter((post, index, self) =>
          index === self.findIndex((p) => p.id === post.id)
        );
        
        console.log('Unique posts after deduplication:', uniquePosts.length);
        setPosts(uniquePosts as any);
        setHasMore(postsData.length >= 50);
      } catch (error: any) {
        console.error('Error fetching posts:', error.message);
        showToast('Unable to load feed. Please check if the backend server is running.');
        setPosts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [activeFilter]); // Re-fetch when filter changes

  // Load More
  const loadMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    try {
      const offset = posts.length;
      
      // Map filter to backend type
      let typeFilter: string | undefined;
      if (activeFilter === 'Projects') typeFilter = 'project';
      else if (activeFilter === 'Opportunities') typeFilter = 'job';
      else if (activeFilter === 'Posts') typeFilter = 'post';
      else if (activeFilter === 'Tech News') typeFilter = 'tech-news';
      
      const postsData = await getPosts({ 
        limit: 50, 
        offset,
        type: typeFilter 
      });
      
      if (postsData.length === 0) {
        setHasMore(false);
      } else {
        const mappedPosts = postsData.map((post) => ({
          id: post.id,
          type: (post.type?.toLowerCase() === 'regular' ? 'regular' : post.type?.toLowerCase()) || 'regular',
          author: {
            id: post.userId || post.user?.id,
            name: post.user?.username || post.author?.username || 'Unknown User',
            avatar: post.user?.profilePicture || post.author?.avatar_url,
            role: post.user?.verified ? 'Verified' : 'Member'
          },
          createdAt: post.createdAt,
          likes: post.likesCount || post.likes || 0,
          comments: post.commentsCount || post.comments || 0,
          title: post.title,
          content: post.content,
          image: post.mediaUrls?.[0],
          company: post.company,
          description: post.projectDescription,
          location: post.location,
          salary: post.salary,
          tags: post.tags,
          jobType: post.jobType,
          summary: post.content || post.newsTitle, // Use content as summary for tech news
          source: post.newsSource,
          url: post.newsUrl,
          imageUrl: post.mediaUrls?.[0],
        }));
        
        setPosts(prev => {
          // Deduplicate before adding to existing posts
          const existingIds = new Set(prev.map(p => p.id));
          const newUniquePosts = mappedPosts.filter(post => !existingIds.has(post.id));
          
          return [...prev, ...newUniquePosts] as any;
        });
        setPage(prev => prev + 1);
        setHasMore(postsData.length >= 50);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, posts.length, activeFilter]);

  // Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMorePosts]);

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    showToast('Post deleted successfully');
  };

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      <Toast 
        message={toastMessage} 
        isVisible={toastVisible} 
        onClose={() => setToastVisible(false)} 
      />

      {/* LEFT SIDEBAR */}
      <LeftPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
         isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 min-w-0 w-full md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} p-4 pt-24 md:p-8 md:pt-24 max-w-5xl mx-auto transition-all duration-300 pb-24 md:pb-8 relative`}>
        
        {/* TOP NAVIGATION BAR */}
        <TopNavigation 
          title="Feed" 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          className={`md:left-[88px] ${isSidebarExpanded ? 'lg:left-[260px]' : 'lg:left-[88px]'}`}
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

        {/* Filter Pills */}
        <FeedFilters 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter} 
          isDarkMode={isDarkMode} 
        />

        {/* Notification Bars */}
        <div className="space-y-2 mb-6">
          <InactiveAccountAlert 
            show={showInactiveAlert} 
            onClose={() => setShowInactiveAlert(false)} 
            onResendEmail={handleResendEmail} 
            isResending={isResending}
            isDarkMode={isDarkMode}
          />
        </div>

        {posts.length === 0 && !loading && (
          <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-sm">Be the first to share something with the community!</p>
          </div>
        )}

        {posts.map((post, index) => {
          if (posts.length === index + 1) {
             return (
               <div ref={lastPostElementRef} key={post.id}>
                 <FeedItem 
                   post={post} 
                   onRequestJoin={(authorName) => showToast(post.type === 'job' ? `Application sent to ${authorName}!` : `Request sent. ${authorName} will review your request.`)} 
                   onDelete={handleDeletePost}
                   isDarkMode={isDarkMode} 
                 />
               </div>
             );
          } else {
             return (
               <div key={post.id}>
                 <FeedItem 
                   post={post} 
                   onRequestJoin={(authorName) => showToast(post.type === 'job' ? `Application sent to ${authorName}!` : `Request sent. ${authorName} will review your request.`)} 
                   onDelete={handleDeletePost}
                   isDarkMode={isDarkMode} 
                 />
               </div>
             );
          }
        })}
        
        {loading && (
          <div className="py-8 text-center flex flex-col items-center justify-center text-gray-400">
             <div className="w-8 h-8 border-4 border-gray-200 border-t-[#E50914] rounded-full animate-spin mb-2"></div>
             <span className="text-sm font-medium">Loading more updates...</span>
          </div>
        )}
        
        {!hasMore && posts.length > 0 && (
           <div className="py-8 text-center text-gray-400 text-sm font-medium">
              You&apos;re all caught up!
           </div>
        )}

      </main>

      {/* FLOATING ACTION BUTTON */}
      <FeedFab />
    </div>
  );
}
