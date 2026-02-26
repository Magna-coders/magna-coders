"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopNavigation from '@/components/TopNavigation';
import LeftPanel from '@/components/LeftPanel';
import MobileDrawer from '@/components/MobileDrawer';
import NotificationItem from '@/components/NotificationItem';
import NotificationHeader from '@/components/NotificationHeader';
import NotificationFilters from '@/components/NotificationFilters';
import NotificationStats from '@/components/NotificationStats';
import NotificationEmptyState from '@/components/NotificationEmptyState';
import { MOCK_NOTIFICATIONS, Notification } from './data';

export default function NotificationsPage() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [router]);
  const [activeTab, setActiveTab] = useState('Notifications');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'job_opportunities' | 'projects'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiUrl) throw new Error('API URL is not defined');
        
        const response = await fetch(`${apiUrl}/social/notifications`, {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Assuming backend returns array of notifications or { notifications: [] }
          const notificationsData = Array.isArray(data) ? data : (data.notifications || []);
          
          // Map backend data to frontend Notification interface if needed
          // For now, assuming backend structure matches or falling back to empty
          setNotifications(notificationsData.length > 0 ? notificationsData : MOCK_NOTIFICATIONS);
        } else {
          // Fallback to mock data if API fails (e.g. 404 or 500)
          console.warn('Failed to fetch notifications, using mock data');
          setNotifications(MOCK_NOTIFICATIONS);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications(MOCK_NOTIFICATIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

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

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'job_opportunities') {
      return n.type === 'job_request' || n.type === 'job_approved';
    }
    if (filter === 'projects') {
      return n.type === 'project_request' || n.type === 'project_approved' || n.type === 'project_invite' || n.type === 'project_application';
    }
    return true;
  });

  const requestsCount = filteredNotifications.filter(n => n.actionRequired && n.requestStatus === 'pending').length;

  const hasUnread = (type: 'all' | 'job_opportunities' | 'projects') => {
    if (type === 'all') return notifications.some(n => !n.read);
    if (type === 'job_opportunities') {
      return notifications.some(n => !n.read && (n.type === 'job_request' || n.type === 'job_approved'));
    }
    if (type === 'projects') {
      return notifications.some(n => !n.read && (n.type === 'project_request' || n.type === 'project_approved' || n.type === 'project_invite' || n.type === 'project_application'));
    }
    return false;
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAccept = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const notification = notifications.find(n => n.id === id);
    
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          read: true,
          actionRequired: false,
          requestStatus: 'accepted',
          content: 'You accepted the request'
        };
      }
      return n;
    }));

    // Redirect to messages if it's a job request
    if (notification && notification.type === 'job_request') {
      const params = new URLSearchParams();
      params.set('action', 'start_chat');
      params.set('name', notification.actor.name);
      params.set('initials', notification.actor.initials);
      router.push(`/messages?${params.toString()}`);
    }
  };

  const handleDecline = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          read: true,
          actionRequired: false,
          requestStatus: 'declined',
          content: 'You declined the request'
        };
      }
      return n;
    }));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

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
          title="Notifications" 
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

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pt-[65px] md:pt-[80px]">
          <div className="max-w-3xl mx-auto p-4 md:p-8 mb-20 md:mb-0">
            
            {/* Header Actions */}
            <NotificationHeader 
              isDarkMode={isDarkMode}
              onMarkAllRead={markAllAsRead}
              onClearAll={clearAllNotifications}
            />

            {/* FILTERS */}
            <NotificationFilters 
              filter={filter}
              setFilter={setFilter}
              hasUnread={hasUnread}
              isDarkMode={isDarkMode}
            />

            {/* REQUESTS SUMMARY (Only for filtered views) */}
            <NotificationStats 
              requestsCount={requestsCount}
              filter={filter}
              isDarkMode={isDarkMode}
            />

            {/* NOTIFICATION LIST */}
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <NotificationEmptyState isDarkMode={isDarkMode} />
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    isDarkMode={isDarkMode}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
