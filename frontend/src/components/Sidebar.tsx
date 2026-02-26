import React from 'react';
import Link from 'next/link';
import { LayoutGrid, Users, MessageCircleQuestion, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-[80px] bg-white border-r border-gray-100 flex-col items-center py-6 gap-8 z-20 hidden md:flex">
      <Link href="/feed" className="w-10 h-10 rounded-lg bg-[#E50914] flex items-center justify-center text-white mb-4 shadow-md hover:bg-[#cc0812] transition-colors">
         <span className="font-bold text-xl">M</span>
      </Link>

      <div className="flex flex-col gap-6 w-full items-center">
        <Link href="/feed" className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-[#E50914] transition-all relative group">
          <LayoutGrid size={24} />
           <span className="absolute left-full ml-4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Feed</span>
        </Link>
        
        <button className="p-3 rounded-xl text-[#E50914] bg-red-50 relative group">
          <Users size={24} />
           <span className="absolute left-full ml-4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Friends</span>
        </button>

        <Link href="/messages" className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-[#E50914] transition-all relative group">
          <MessageCircleQuestion size={24} />
           <span className="absolute left-full ml-4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Messages</span>
        </Link>
      </div>

      <div className="mt-auto flex flex-col gap-6 w-full items-center">
        <Link href="/settings" className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-[#E50914] transition-all relative group">
          <Settings size={24} />
           <span className="absolute left-full ml-4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Settings</span>
        </Link>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:shadow-md transition-all">
          JD
        </div>
      </div>
    </div>
  );
}
