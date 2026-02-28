'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, Briefcase, FileText, Plus } from 'lucide-react';
import MagnaNewIcon from '@/components/MagnaNewIcon';

export default function FeedFab() {
  const [isFabOpen, setIsFabOpen] = useState(false);

  return (
      <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 flex flex-col items-end gap-4">
        {/* FAB Menu Options */}
         <div className={`flex flex-col items-end gap-3 transition-all duration-300 ${isFabOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
            {/* Project Option */}
            <Link href="/create-project" className="flex items-center gap-3 group">
               <span className="bg-white px-3 py-1.5 rounded-lg shadow-md text-sm font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Create Project</span>
               <div className="w-12 h-12 rounded-full bg-white text-[#F4A261] shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all">
                 <FolderKanban size={24} />
               </div>
            </Link>
            
            {/* Job Option */}
            <Link href="/create-job" className="flex items-center gap-3 group">
               <span className="bg-white px-3 py-1.5 rounded-lg shadow-md text-sm font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Post Job</span>
               <div className="w-12 h-12 rounded-full bg-white text-[#2ECC71] shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all">
                 <Briefcase size={24} />
               </div>
            </Link>
 
            {/* Post Option */}
            <Link href="/create-post" className="flex items-center gap-3 group">
               <span className="bg-white px-3 py-1.5 rounded-lg shadow-md text-sm font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Create Post</span>
               <div className="w-12 h-12 rounded-full bg-white text-[#E50914] shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all">
                 <FileText size={24} /> 
               </div>
            </Link>
         </div>

        {/* Main FAB Container */}
        <div className="relative">
          {/* Main FAB */}
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 hover:shadow-2xl ${isFabOpen ? 'bg-gray-800 rotate-45' : 'bg-[#E50914] hover:bg-[#cc0812]'}`}
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
          
          {/* Tiny Magna Icon Overlay */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50">
             <Link href="/magna-ai">
               <button className="w-8 h-8 rounded-lg bg-white text-[#E50914] shadow-md flex items-center justify-center border border-gray-100">
                  <MagnaNewIcon className="w-5 h-5" />
               </button>
             </Link>
          </div>
        </div>
      </div>
  );
}
