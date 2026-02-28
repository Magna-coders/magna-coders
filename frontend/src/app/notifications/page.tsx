"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import LeftPanel from '@/components/LeftPanel';
import MobileDrawer from '@/components/MobileDrawer';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, Notification, FriendRequestNotification } from '@/services/notifications';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friends';
import { updateApplicationStatus } from '@/services/jobs';
import { UserPlus, Check, X, Bell, Trash2, Clock, Briefcase } from 'lucide-react';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setFriendRequests(data.friendRequests);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await acceptFriendRequest(requestId);
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      // Optionally show success message
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await rejectFriendRequest(requestId);
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleAcceptApplication = async (applicationId: string, notificationId: string) => {
    setProcessingApplication(applicationId);
    try {
      await updateApplicationStatus(applicationId, 'accepted');
      // Remove notification after accepting
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to accept application:', error);
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleRejectApplication = async (applicationId: string, notificationId: string) => {
    setProcessingApplication(applicationId);
    try {
      await updateApplicationStatus(applicationId, 'rejected');
      // Remove notification after rejecting
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to reject application:', error);
    } finally {
      setProcessingApplication(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bell className={`w-6 h-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`} />
                <h1 className="text-2xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 text-xs font-semibold bg-[#E70008] text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#F9E4AD]' 
                      : 'bg-white hover:bg-gray-50 text-[#444444]'
                  }`}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E70008]"></div>
              </div>
            ) : (
              <>
                {/* FRIEND REQUESTS SECTION */}
                {friendRequests.length > 0 && (
                  <div className="mb-8">
                    <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
                      <UserPlus className="w-5 h-5" />
                      Friend Requests ({friendRequests.length})
                    </h2>
                    <div className="space-y-3">
                      {friendRequests.map((request) => (
                        <div
                          key={request.id}
                          className={`p-4 rounded-xl transition-all ${
                            isDarkMode 
                              ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a]' 
                              : 'bg-white hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {request.sender.avatar_url ? (
                                <img
                                  src={request.sender.avatar_url}
                                  alt={request.sender.username}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-[#E70008] flex items-center justify-center text-white font-semibold">
                                  {request.sender.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
                                {request.sender.username}
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
                                wants to connect with you
                              </p>
                              {request.sender.bio && (
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#F9E4AD]/50' : 'text-gray-500'}`}>
                                  {request.sender.bio}
                                </p>
                              )}
                              <p className={`text-xs mt-2 ${isDarkMode ? 'text-[#F9E4AD]/50' : 'text-gray-500'}`}>
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptFriendRequest(request.id)}
                                disabled={processingRequest === request.id}
                                className="p-2 bg-[#E70008] hover:bg-[#c50007] text-white rounded-lg transition-colors disabled:opacity-50"
                                title="Accept"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(request.id)}
                                disabled={processingRequest === request.id}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  isDarkMode 
                                    ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F9E4AD]' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-[#444444]'
                                }`}
                                title="Decline"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS SECTION */}
                <div>
                  <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
                    Recent Activity
                  </h2>
                  {notifications.length === 0 && friendRequests.length === 0 ? (
                    <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                      <Bell className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-[#F9E4AD]/30' : 'text-gray-300'}`} />
                      <p className={`text-lg font-medium ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
                        No notifications yet
                      </p>
                      <p className={`text-sm mt-2 ${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
                        When you get notifications, they'll show up here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => {
                        // Check if this is a job application notification
                        const isJobApplication = notification.application_id && notification.applications;
                        const canAcceptReject = isJobApplication && 
                          notification.title === 'New Job Application' &&
                          notification.applications?.opportunities.author_id === notification.user_id;

                        // Check if this is a project notification
                        const isProjectNotification = notification.project_id && notification.projects;

                        // Check if this is an AI response notification
                        const isAIResponse = notification.post_id && notification.title === 'Magna AI responded to your post';

                        return (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-xl transition-all ${
                              notification.is_read
                                ? isDarkMode ? 'bg-[#1a1a1a]/50' : 'bg-gray-50'
                                : isDarkMode ? 'bg-[#1a1a1a] border-l-4 border-[#E70008]' : 'bg-white border-l-4 border-[#E70008]'
                            } ${(isProjectNotification || isAIResponse) ? 'cursor-pointer hover:shadow-lg' : ''}`}
                            onClick={() => {
                              if (isProjectNotification) {
                                router.push(`/projects/${notification.project_id}`);
                              } else if (isAIResponse) {
                                router.push(`/feed?postId=${notification.post_id}`);
                              }
                            }}
                          >
                            <div className="flex items-start gap-4">
                              {/* Icon for job applications */}
                              {isJobApplication && (
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 rounded-full bg-[#E70008]/10 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-[#E70008]" />
                                  </div>
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
                                  {notification.title}
                                </p>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
                                  {notification.message}
                                </p>
                                {isProjectNotification && (
                                  <p className={`text-xs mt-2 font-medium ${isDarkMode ? 'text-[#E70008]' : 'text-[#E70008]'}`}>
                                    Click to view project →
                                  </p>
                                )}
                                {isAIResponse && (
                                  <p className={`text-xs mt-2 font-medium ${isDarkMode ? 'text-[#E70008]' : 'text-[#E70008]'}`}>
                                    Click to view post and AI response →
                                  </p>
                                )}
                                <p className={`text-xs mt-2 ${isDarkMode ? 'text-[#F9E4AD]/50' : 'text-gray-500'}`}>
                                  {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                                </p>

                                {/* Accept/Reject buttons for job applications */}
                                {canAcceptReject && notification.applications && (
                                  <div className="flex gap-2 mt-3">
                                    <button
                                      onClick={() => handleAcceptApplication(notification.application_id!, notification.id)}
                                      disabled={processingApplication === notification.application_id}
                                      className="px-4 py-2 bg-[#E70008] hover:bg-[#c50007] text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                                    >
                                      {processingApplication === notification.application_id ? 'Processing...' : 'Accept'}
                                    </button>
                                    <button
                                      onClick={() => handleRejectApplication(notification.application_id!, notification.id)}
                                      disabled={processingApplication === notification.application_id}
                                      className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium ${
                                        isDarkMode 
                                          ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F9E4AD]' 
                                          : 'bg-gray-200 hover:bg-gray-300 text-[#444444]'
                                      }`}
                                    >
                                      {processingApplication === notification.application_id ? 'Processing...' : 'Reject'}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {!notification.is_read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      isDarkMode 
                                        ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F9E4AD]' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-[#444444]'
                                    }`}
                                    title="Mark as read"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isDarkMode 
                                      ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F9E4AD]' 
                                      : 'bg-gray-200 hover:bg-gray-300 text-[#444444]'
                                  }`}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
