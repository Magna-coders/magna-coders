"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/services/posts';
import { FileText, Heart, MessageCircle, Share2, Calendar } from 'lucide-react';

interface UserPostsTabProps {
  posts: Post[];
  loading: boolean;
  isDarkMode: boolean;
}

export default function UserPostsTab({ posts, loading, isDarkMode }: UserPostsTabProps) {
  const router = useRouter();

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  if (loading) {
    return (
      <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E70008]"></div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
        <div className="text-center py-12">
          <FileText className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-[#F9E4AD]/30' : 'text-gray-300'}`} />
          <p className={`text-lg font-medium ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
            No posts yet
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
            Posts will appear here once they're created
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      <h3 className={`font-bold text-lg mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
        Posts ({posts.length})
      </h3>
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => handlePostClick(post.id)}
            className={`p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
              isDarkMode 
                ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a]' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {/* Post Type Badge */}
            {post.type !== 'REGULAR' && (
              <div className="mb-2">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                  post.type === 'JOB' ? 'bg-blue-500 text-white' :
                  post.type === 'PROJECT' ? 'bg-green-500 text-white' :
                  'bg-purple-500 text-white'
                }`}>
                  {post.type}
                </span>
              </div>
            )}

            {/* Post Title (for job/project posts) */}
            {post.title && (
              <h4 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
                {post.title}
              </h4>
            )}

            {/* Post Content */}
            <p className={`text-sm mb-3 line-clamp-3 ${isDarkMode ? 'text-[#F9E4AD]/80' : 'text-gray-700'}`}>
              {post.content}
            </p>

            {/* Post Media Preview */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                {post.mediaUrls.slice(0, 2).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt="Post media"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
                {post.mediaUrls.length > 2 && (
                  <div className={`flex items-center justify-center rounded-lg ${
                    isDarkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
                  }`}>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
                      +{post.mediaUrls.length - 2} more
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Post Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className={`flex items-center gap-1 ${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
                <Heart className="w-4 h-4" />
                <span>{post.likes}</span>
              </div>
              <div className={`flex items-center gap-1 ${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments}</span>
              </div>
              <div className={`flex items-center gap-1 ml-auto ${isDarkMode ? 'text-[#F9E4AD]/50' : 'text-gray-500'}`}>
                <Calendar className="w-4 h-4" />
                <span className="text-xs">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.tags.slice(0, 3).map((tag: any, index: number) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs rounded-full ${
                      isDarkMode 
                        ? 'bg-[#2a2a2a] text-[#F9E4AD]/70' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    #{typeof tag === 'string' ? tag : tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
