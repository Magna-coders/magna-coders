import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface JobPageHeaderProps {
  isDarkMode: boolean;
}

export default function JobPageHeader({ isDarkMode }: JobPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Opportunities</h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Find your next dream role</p>
      </div>
      
      <div className="flex items-center gap-4">
        <Link href="/create-job" className="flex items-center justify-center gap-2 px-6 py-3 bg-[#E50914] text-white rounded-xl font-bold shadow-md hover:bg-[#cc0812] transition-all active:scale-95 w-full md:w-auto">
          <Plus size={20} />
          <span>Post a Job</span>
        </Link>
      </div>
    </div>
  );
}
