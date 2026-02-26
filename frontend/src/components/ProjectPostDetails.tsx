import React from 'react';
import type { ProjectPost } from '@/types';
import PostInteractionBar from './PostInteractionBar';

interface ProjectPostDetailsProps {
  post: ProjectPost;
  isRequestSent: boolean;
  onRequest: () => void;
}

export default function ProjectPostDetails({ post, isRequestSent, onRequest }: ProjectPostDetailsProps) {
  return (
    <div className="space-y-8">
       <div className="flex items-center gap-3 mb-4">
          <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold">
              Project Collaboration
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 font-medium">Looking for contributors</span>
      </div>
      
      <h2 className="font-bold text-3xl text-black">{post.title}</h2>
      
      <p className="text-gray-600 leading-relaxed text-lg">
          {post.description}
      </p>
      
      <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
          <h4 className="font-bold text-xl text-gray-900 mb-4">Project Details</h4>
          <p className="text-gray-600 mb-6 text-lg">
              We are building this project to solve a common problem in the developer community. We are looking for passionate developers to join us.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
              {post.tags.map(tag => (
                  <span key={tag} className="px-5 py-2 rounded-full bg-[#F4A261] text-white text-sm font-bold shadow-sm">
                      {tag}
                  </span>
              ))}
          </div>
          
          <PostInteractionBar initialLikes={post.likes} initialComments={post.comments} postId={post.id} />
      </div>
      
      <button 
          onClick={onRequest}
          disabled={isRequestSent}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform ${
              isRequestSent 
                  ? 'bg-gray-400 cursor-default' 
                  : 'bg-[#E50914] hover:bg-[#cc0812] hover:-translate-y-1'
          }`}
      >
          {isRequestSent ? 'Request Sent' : 'Request to Join'}
      </button>
    </div>
  );
}
