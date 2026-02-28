'use client';

import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getPostById } from '@/services/posts';
import type { FeedPost, JobPost, ProjectPost, TechNewsPost, RegularPost } from '@/types';
import LeftPanel from '@/components/LeftPanel';
import Toast from '@/components/Toast';
import PostHeader from '@/components/PostHeader';
import JobPostDetails from '@/components/JobPostDetails';
import ProjectPostDetails from '@/components/ProjectPostDetails';
import TechNewsPostDetails from '@/components/TechNewsPostDetails';
import { formatTimeAgo } from '@/utils/timeFormat';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  useEffect(() => {
    if (params?.id) {
      const fetchPost = async () => {
        try {
          const foundPost = await getPostById(params.id as string);
          if (foundPost) {
            // Map to component format (same as feed page)
            const mappedPost = {
              id: foundPost.id,
              type: (foundPost.type?.toLowerCase() === 'regular' ? 'regular' : foundPost.type?.toLowerCase()) || 'regular',
              author: {
                id: foundPost.userId || foundPost.user?.id,
                name: foundPost.user?.username || 'Unknown User',
                avatar: foundPost.user?.profilePicture,
                role: foundPost.user?.verified ? 'Verified' : 'Member'
              },
              createdAt: formatTimeAgo(foundPost.createdAt),
              likes: foundPost.likes || 0,
              comments: foundPost.comments || 0,
              isLiked: (foundPost as any).isLiked || false, // Add isLiked status
              title: foundPost.title,
              content: foundPost.content,
              image: foundPost.mediaUrls?.[0],
              company: foundPost.company,
              description: foundPost.projectDescription,
              location: foundPost.location,
              salary: foundPost.salary,
              tags: foundPost.tags,
              jobType: foundPost.jobType,
              summary: foundPost.content || foundPost.newsTitle, // Use content as summary for tech news
              source: foundPost.newsSource,
              url: foundPost.newsUrl,
              imageUrl: foundPost.mediaUrls?.[0],
            };
            setPost(mappedPost as any);
          } else {
            setPost(null);
          }
        } catch (error) {
          console.error('Error fetching post:', error);
          setPost(null);
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#E50914] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Link href="/feed" className="text-[#E50914] hover:underline">Return to Feed</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F5] font-sans text-[#444444] flex">
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
        setIsSidebarExpanded={setIsSidebarExpanded}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 w-full md:ml-[88px] lg:ml-[260px] p-4 md:p-8 max-w-5xl mx-auto transition-all duration-300 pb-24 md:pb-8">
        
        {/* Back Button */}
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium">Back to Feed</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             {/* Header */}
             <PostHeader post={post} />

            <div className="p-6 md:p-8">
                {/* Type Specific Content */}
                {post.type === 'job' && (
                    <JobPostDetails 
                        post={post as JobPost} 
                        isApplied={isApplied} 
                        onApply={() => {
                            setIsApplied(true);
                            showToast(`Application sent to ${post.author.name}!`);
                        }} 
                    />
                )}

                {post.type === 'project' && (
                    <ProjectPostDetails 
                        post={post as ProjectPost} 
                        isRequestSent={isRequestSent} 
                        onRequest={() => {
                            setIsRequestSent(true);
                            showToast(`Request sent. ${post.author.name} will review your request.`);
                        }} 
                    />
                )}

                {post.type === 'tech-news' && (
                    <TechNewsPostDetails post={post as TechNewsPost} />
                )}

                {(post.type === 'post' || post.type === 'regular') && (
                    <RegularPostDetails post={post as RegularPost} />
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
