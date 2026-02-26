import React from 'react';
import { Globe } from 'lucide-react';

interface PostDetailHeaderProps {
  author: {
    name: string;
    role: string;
  };
  createdAt: string;
}

export default function PostDetailHeader({ author, createdAt }: PostDetailHeaderProps) {
  return (
    <div className="p-6 md:p-8 border-b border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-2xl">
          {author.name.charAt(0)}
        </div>
        <div>
          <h1 className="font-bold text-black text-2xl">{author.name}</h1>
          <p className="text-gray-500">{author.role}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span>{createdAt}</span>
            <span>•</span>
            <Globe size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
