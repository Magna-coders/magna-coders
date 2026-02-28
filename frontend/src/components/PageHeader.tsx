import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  onBack: () => void;
  isDarkMode: boolean;
}

export default function PageHeader({ title, description, onBack, isDarkMode }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <button 
        onClick={onBack} 
        className={`flex items-center gap-2 hover:text-[#E50914] transition-colors mb-4 md:hidden ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-bold">Back</span>
      </button>
      <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>{title}</h1>
      <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
    </div>
  );
}
