import React from 'react';
import Image from 'next/image';
import type { RegularPost } from '@/types';
import PostInteractionBar from './PostInteractionBar';

interface RegularPostDetailsProps {
  post: RegularPost;
}

export default function RegularPostDetails({ post }: RegularPostDetailsProps) {
  return (
    <div className="space-y-8">
       <span className="px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-sm font-bold inline-block">
          Community Post
      </span>
      <h2 className="font-bold text-3xl text-black">{post.title}</h2>
      <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
          {post.content}
      </p>
      {post.image && (
          <div className="w-full h-96 rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm">
             {post.image.startsWith('data:video/') ? (
               // Video display
               <video 
                 src={post.image} 
                 controls 
                 className="w-full h-full object-cover" 
               />
             ) : post.image.startsWith('data:') ? (
               // Use regular img tag for base64 image data URLs
               <img 
                 src={post.image} 
                 alt="Post Content" 
                 className="w-full h-full object-cover" 
               />
             ) : (
               // Use Next.js Image for external URLs
               <Image 
                 src={post.image} 
                 alt="Post Content" 
                 fill 
                 className="object-cover" 
               />
             )}
          </div>
      )}
      
      <PostInteractionBar 
        initialLikes={post.likes} 
        initialComments={post.comments} 
        postId={post.id}
        initialLiked={(post as any).isLiked || false}
      />
    </div>
  );
}
