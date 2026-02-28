import React from 'react';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import type { TechNewsPost } from '@/types';
import PostInteractionBar from './PostInteractionBar';

interface TechNewsPostDetailsProps {
  post: TechNewsPost;
}

export default function TechNewsPostDetails({ post }: TechNewsPostDetailsProps) {
  return (
    <div className="space-y-8">
      {post.imageUrl && (
        <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden relative shadow-md">
          {post.imageUrl.startsWith('data:') ? (
            // Use regular img tag for base64 data URLs
            <img 
              src={post.imageUrl} 
              alt="News" 
              className="w-full h-full object-cover" 
            />
          ) : (
            // Use Next.js Image for external URLs
            <Image 
              src={post.imageUrl} 
              alt="News" 
              fill 
              className="object-cover" 
            />
          )}
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center gap-2">
          <Globe size={14} />
          {post.source}
        </span>
        <span className="text-gray-500 font-medium">{post.createdAt}</span>
      </div>
      <h2 className="font-bold text-3xl md:text-4xl text-black leading-tight">{post.title}</h2>
      
      {/* Display actual content if available */}
      {post.content && (
        <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
          {post.content}
        </div>
      )}
      
      {post.summary && post.summary !== post.title && (
        <p className="text-gray-600 leading-relaxed text-xl">
          {post.summary}
        </p>
      )}
      
      <PostInteractionBar 
        initialLikes={post.likes} 
        initialComments={post.comments} 
        postId={post.id}
        initialLiked={(post as any).isLiked || false}
      />

      <a href={post.url} target="_blank" rel="noopener noreferrer" className="block w-full py-4 rounded-xl bg-black text-white font-bold text-lg shadow-lg hover:bg-gray-800 transition-all text-center transform hover:-translate-y-1">
        Read Full Article
      </a>
    </div>
  );
}
