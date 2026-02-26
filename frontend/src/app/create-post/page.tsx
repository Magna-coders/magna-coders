"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import LeftPanel from '@/components/LeftPanel';
import UserPrivacySelector from '@/components/UserPrivacySelector';
import PostEditor from '@/components/PostEditor';
import PostToolbar from '@/components/PostToolbar';
import Toast from '@/components/Toast';

interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  profilePicture?: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGistId, setSelectedGistId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacy, setPrivacy] = useState('Public');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        // Check both userId and userid for compatibility
        const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
        
        if (!token || !userId) {
          console.warn('No access token or userId found. User may need to login.');
          setIsLoadingProfile(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/profile/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const profileData = result.data || result;
          // Map avatar_url from Google OAuth to profilePicture
          setUserProfile({
            ...profileData,
            profilePicture: profileData.avatar_url || profileData.profilePicture
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Check file size (50MB = 52428800 bytes)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        setToastMessage('File size must be less than 50MB');
        setShowToast(true);
        return;
      }
      
      // Check file type (images and videos)
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setToastMessage('Only images and videos are allowed');
        setShowToast(true);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setToastMessage('Media added successfully');
        setShowToast(true);
      };
      reader.onerror = () => {
        setToastMessage('Failed to read file. Please try again.');
        setShowToast(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (50MB = 52428800 bytes)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        setToastMessage('File size must be less than 50MB');
        setShowToast(true);
        e.target.value = ''; // Reset input
        return;
      }
      
      // Check file type (images and videos)
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setToastMessage('Only images and videos are allowed');
        setShowToast(true);
        e.target.value = ''; // Reset input
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setToastMessage('Media added successfully');
        setShowToast(true);
      };
      reader.onerror = () => {
        setToastMessage('Failed to read file. Please try again.');
        setShowToast(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) return;
    
    setIsSubmitting(true);
    
    try {
      // Get token
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('You must be logged in to post. Please try logging in again.');
      }

      // Create post using the service
      const postData: any = {
        title: content.length > 50 ? content.slice(0, 50) + "..." : content.slice(0, 30) || "New Post",
        content: content,
        post_type: 'regular'
      };

      // If image is selected, add it to mediaUrls
      if (selectedImage) {
        postData.mediaUrls = [selectedImage];
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      console.log('Post created successfully');
      setToastMessage('Post created successfully!');
      setShowToast(true);
      
      // Redirect after a short delay to show the toast
      setTimeout(() => {
        router.push('/feed');
      }, 1000);
      
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = Boolean(content.trim() || selectedImage);

  // Get user display info
  const getUserName = () => {
    if (isLoadingProfile) return 'Loading...';
    if (!userProfile) return 'User';
    return userProfile.fullName || userProfile.username || userProfile.email.split('@')[0];
  };

  const getUserInitials = () => {
    if (isLoadingProfile || !userProfile) return '?';
    const name = userProfile.fullName || userProfile.username || userProfile.email;
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      <TopNavigation 
        title="Create Post"
        showBack={true}
        hideBackOnMobile={true}
        showSearch={false}
        onMobileMenuOpen={() => {}}
        isDarkMode={isDarkMode}
        customAction={
          <button 
            onClick={handlePost}
            disabled={!canPost || isSubmitting}
            className="text-[#E50914] font-bold text-sm disabled:opacity-50 md:hidden"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        }
      />
      
      {/* LEFT SIDEBAR */}
      <LeftPanel 
        activeTab="Create Post"
        setActiveTab={() => {}}
        isSidebarExpanded={true}
        setIsSidebarExpanded={() => {}}
        isDarkMode={isDarkMode}
        toggleTheme={() => {}} // CreatePost handles theme internally via localStorage listener, but toggle could be wired up if needed
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 w-full md:ml-[88px] lg:ml-[260px] p-0 md:p-8 pt-20 md:pt-24 max-w-3xl mx-auto transition-all duration-300">

        <div className={`md:rounded-3xl shadow-sm border min-h-[calc(100vh-60px)] md:min-h-[500px] flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
          
          {/* User Info & Privacy */}
          <UserPrivacySelector 
            userName={getUserName()}
            userInitials={getUserInitials()}
            userAvatar={userProfile?.profilePicture}
            privacy={privacy}
            onPrivacyChange={setPrivacy}
            isDarkMode={isDarkMode}
          />

          {/* Input Area */}
          <PostEditor 
            content={content}
            setContent={setContent}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            selectedGistId={selectedGistId}
            setSelectedGistId={setSelectedGistId}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isDarkMode={isDarkMode}
          />

          {/* Bottom Toolbar */}
          <PostToolbar 
            onImageSelect={handleImageSelect}
            contentLength={content.length}
            isSubmitting={isSubmitting}
            onPost={handlePost}
            canPost={canPost}
            isDarkMode={isDarkMode}
            onAddGist={(id) => setSelectedGistId(id)}
          />

        </div>

      </main>

      <Toast 
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
