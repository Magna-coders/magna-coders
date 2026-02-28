'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  MoreHorizontal, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Users, 
  Send, 
  ChevronRight,
  Trash2
} from 'lucide-react';
import PostInteractionBar from '@/components/PostInteractionBar';
import { deletePost } from '@/services/posts';
import type { 
  FeedPost, 
  JobPost, 
  ProjectPost, 
  TechNewsPost, 
  RegularPost
} from '@/types';

interface FeedItemProps {
  post: FeedPost;
  onRequestJoin?: (authorName: string) => void;
  onDelete?: (postId: string) => void;
  isDarkMode?: boolean;
}

export default function FeedItem({ post, onRequestJoin, onDelete, isDarkMode }: FeedItemProps) {
  const router = useRouter();
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Check if current user owns this post
  useEffect(() => {
    // Check both userId and userid for compatibility
    const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
    if (userId && post.author?.id === userId) {
      setIsOwner(true);
    }
  }, [post.author?.id]);

  // Move hooks to top level to avoid conditional hook calls
  const jobPost = post.type === 'job' ? post as JobPost : null;
  const projectPost = post.type === 'project' ? post as ProjectPost : null;
  
  // Job progress bar state
  const [progress, setProgress] = useState(jobPost?.deadlineProgress || 0);
  
  // Project live requests state
  const [liveRequests, setLiveRequests] = useState(projectPost?.requestsSent || 0);

  // Job progress effect
  useEffect(() => {
    if (jobPost && progress < 100) {
      const interval = setInterval(() => {
        if (Math.random() > 0.5) {
          setProgress(prev => Math.min(prev + 0.5, 100));
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [jobPost, progress]);

  // Project live requests effect
  useEffect(() => {
    if (projectPost) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          setLiveRequests(prev => prev + 1);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [projectPost]);

  const handleRequestJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRequestSent(true);
    onRequestJoin?.(post.author.name);
  };

  const handleApply = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isApplied) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Please login to apply');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/applications/${post.id}/apply`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeUrl: "string", 
          coverLetter: "string", 
          metadata: {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply');
      }

      setIsApplied(true);
      // Add a small delay to ensure the toast shows after state update
      setTimeout(() => {
        onRequestJoin?.(post.author.name);
      }, 100);
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Failed to apply for job. Please try again.');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onDelete?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const cardClassName = `block rounded-2xl p-4 md:p-6 shadow-sm mt-6 cursor-pointer hover:shadow-md transition-all text-left w-full ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20 shadow-[0_0_15px_rgba(231,0,8,0.1)] text-[#F4A261]' : 'bg-white'}`;

  // Job Post
  if (post.type === 'job') {
    const job = post as JobPost;

    return (
        <Link href={`/post/${post.id}`} className={cardClassName}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-sm overflow-hidden relative">
                {post.author.avatar ? (
                  <Image src={post.author.avatar} alt={post.author.name} fill sizes="40px" className="object-cover" />
                ) : (
                  post.author.name.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{post.author.name}</h3>
                  <span className="text-sm text-gray-500">{post.author.role}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{post.createdAt}</span>
                  <span>•</span>
                  <Globe size={12} />
                </div>
              </div>
            </div>
            <div className="relative">
              <div 
                role="button" 
                className="text-gray-400 hover:text-black cursor-pointer" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  if (isOwner) setShowMenu(!showMenu);
                }}
              >
                <MoreHorizontal size={20} />
              </div>
              {isOwner && showMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[150px]">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    {isDeleting ? 'Deleting...' : 'Delete Post'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className={`font-bold mb-1 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>{job.company} is hiring! {job.title}</p>
            <p className={isDarkMode ? 'text-[#F4A261]' : 'text-gray-600'}>{job.description}</p>
          </div>

          <div className={`border rounded-xl p-3 md:p-5 ${isDarkMode ? 'border-[#2ECC71]/20 bg-[#2ECC71]/5' : 'border-[#2ECC71]/30 bg-[#2ECC71]/5'}`}>
            <div className="flex items-start gap-3 md:gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#F4A261] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Briefcase size={24} />
              </div>
              <div>
                <h4 className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>{job.title}</h4>
                <p className={`text-sm ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-600'}`}>{job.company}</p>
              </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Application Deadline</span>
                    <span className="text-[10px] font-bold text-[#E50914]">{job.timeLeft}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-[#F4A261] to-[#E50914] transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className={`flex flex-wrap gap-4 mb-6 text-sm ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-600'}`}>
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className={`text-gray-400 ${isDarkMode ? 'text-[#F4A261]' : ''}`} />
                {job.location}
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase size={16} className={`text-gray-400 ${isDarkMode ? 'text-[#F4A261]' : ''}`} />
                {job.jobType}
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign size={16} className={`text-gray-400 ${isDarkMode ? 'text-[#F4A261]' : ''}`} />
                {job.salary}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {job.tags.map((tag) => (
                <span key={tag} className={`px-3 py-1 rounded-full text-xs font-medium border ${isDarkMode ? 'bg-[#222] text-[#F4A261] border-gray-700' : 'bg-white text-gray-600 border-gray-100'}`}>
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2 md:gap-3">
              <button 
                onClick={e => { e.preventDefault(); /* Logic */ }}
                className={`flex-1 py-2 md:py-2.5 rounded-full border text-xs md:text-sm font-semibold transition-all ${isDarkMode ? 'bg-transparent border-gray-700 text-[#F4A261] hover:bg-white/10' : 'bg-white border-gray-200 text-black hover:bg-gray-50'}`}
              >
                View Details
              </button>
              <button 
                onClick={handleApply}
                disabled={isApplied}
                className={`flex-1 py-2 md:py-2.5 rounded-full text-white text-xs md:text-sm font-semibold shadow-md transition-all ${
                  isApplied
                    ? 'bg-gray-400 cursor-default'
                    : 'bg-[#E50914] hover:bg-[#cc0812]'
                }`}
              >
                {isApplied ? 'Applied' : 'Apply Now'}
              </button>
            </div>
          </div>
        </Link>
    );
  }

  if (post.type === 'project') {
    const project = post as ProjectPost;

    return (
        <Link href={`/post/${post.id}`} className={cardClassName}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-sm overflow-hidden relative">
                {post.author.avatar ? (
                  <Image src={post.author.avatar} alt={post.author.name} fill sizes="40px" className="object-cover" />
                ) : (
                  post.author.name.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{post.author.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{post.createdAt}</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
              Project
            </span>
          </div>

          <div className="mb-4">
            <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>{project.title}</h3>
            <p className={`leading-relaxed ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-600'}`}>
              {project.description}
            </p>
          </div>

          <div className={`flex flex-wrap gap-4 mb-4 text-sm ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-600'}`}>
             <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <Users size={16} className="text-[#F4A261]" />
                <span className={`font-medium ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-700'}`}>{project.membersNeeded} builders needed</span>
             </div>
             <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <Send size={16} className="text-[#E50914]" />
                <span className={`font-medium ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-700'}`}>
                   {liveRequests} requests sent
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1"></span>
             </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span key={tag} className="px-4 py-1.5 rounded-full bg-[#F4A261] text-white text-xs font-bold">
                {tag}
              </span>
            ))}
          </div>

          <PostInteractionBar initialLikes={post.likes} initialComments={post.comments} postId={post.id}>
             <button 
                onClick={handleRequestJoin}
                disabled={isRequestSent}
                className={`w-full sm:w-auto px-6 py-2 rounded-full text-white text-sm font-bold shadow-md transition-all ${
                  isRequestSent 
                    ? 'bg-gray-400 cursor-default' 
                    : 'bg-[#E50914] hover:bg-[#cc0812]'
                }`}
             >
              {isRequestSent ? 'Request Sent' : 'Request to Join'}
            </button>
          </PostInteractionBar>
        </Link>
    );
  }

  // Tech News Post
  if (post.type === 'tech-news') {
    const news = post as TechNewsPost;
    return (
      <Link href={`/post/${post.id}`} className={`${cardClassName} ${isDarkMode ? 'border-[#E70008]/20' : 'border-gray-100'} border`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center gap-1">
              <Globe size={12} />
              {news.source}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">{post.createdAt}</span>
          </div>
          <div role="button" className="text-gray-400 hover:text-black" onClick={e => e.preventDefault()}>
            <MoreHorizontal size={20} />
          </div>
        </div>

        <div className="mb-4">
          <h3 className={`font-bold text-xl mb-2 leading-tight hover:text-[#E50914] cursor-pointer transition-colors ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>
            {news.title}
          </h3>
          <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-600'}`}>
            {news.summary}
          </p>
          
          {news.imageUrl && (
            <div className={`w-full h-48 md:h-64 rounded-xl overflow-hidden mb-4 relative group cursor-pointer ${isDarkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
              {news.imageUrl.startsWith('data:') ? (
                // Use regular img tag for base64 data URLs
                <>
                  <img 
                    src={news.imageUrl} 
                    alt={news.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </>
              ) : (
                // Use Next.js Image for external URLs
                <>
                  <Image 
                    src={news.imageUrl} 
                    alt={news.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </>
              )}
            </div>
          )}
        </div>

        <PostInteractionBar 
           initialLikes={post.likes} 
           initialComments={post.comments} 
           postId={post.id}
        >
             <button 
                onClick={e => { e.preventDefault(); router.push(`/post/${post.id}`); }}
                className="flex items-center gap-2 text-[#E50914] font-bold text-sm hover:underline"
             >
                Read Article
                <ChevronRight size={16} />
             </button>
        </PostInteractionBar>
      </Link>
    );
  }

  // Regular Post
  const regular = post as RegularPost;
  return (
        <Link href={`/post/${post.id}`} className={cardClassName}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-sm overflow-hidden relative">
                {post.author.avatar ? (
                  <Image src={post.author.avatar} alt={post.author.name} fill sizes="40px" className="object-cover" />
                ) : (
                  post.author.name.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{post.author.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{post.createdAt}</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
              Post
            </span>
          </div>

          <div className="mb-4">
            {regular.title && <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>{regular.title}</h3>}
            {regular.content && (
              <p className={`leading-relaxed mb-4 ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-600'}`}>
                {regular.content}
              </p>
            )}
            
            {regular.image && (
                <div className={`w-full h-64 md:h-80 rounded-xl overflow-hidden mb-2 border ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-100 border-gray-100'}`}>
                   {regular.image.startsWith('data:video/') ? (
                     // Video display
                     <video 
                       src={regular.image} 
                       controls 
                       className="w-full h-full object-cover"
                       onError={(e) => console.error('Video load error:', e)}
                     />
                   ) : regular.image.startsWith('data:') ? (
                     // Use regular img tag for base64 image data URLs
                     <img 
                       src={regular.image} 
                       alt="Post Content" 
                       className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                       onError={(e) => {
                         console.error('Image load error:', e);
                         console.log('Image data length:', regular.image.length);
                         console.log('Image data prefix:', regular.image.substring(0, 50));
                       }}
                     />
                   ) : (
                     // Use Next.js Image for external URLs
                     <Image 
                       src={regular.image} 
                       alt="Post Content" 
                       fill 
                       sizes="(max-width: 768px) 100vw, 768px" 
                       className="object-cover hover:scale-105 transition-transform duration-500"
                       onError={(e) => console.error('Next.js Image load error:', e)}
                     />
                   )}
                </div>
            )}
          </div>

          <PostInteractionBar 
             initialLikes={typeof post.likes === 'number' ? post.likes : (Array.isArray(post.likes) ? post.likes.length : 0)} 
             initialComments={typeof post.comments === 'number' ? post.comments : (Array.isArray(post.comments) ? post.comments.length : 0)} 
             postId={post.id} 
          />
        </Link>
  );
}
