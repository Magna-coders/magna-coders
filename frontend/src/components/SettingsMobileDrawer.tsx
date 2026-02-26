import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import LeftPanel from '@/components/LeftPanel';

interface SettingsMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function SettingsMobileDrawer({ isOpen, onClose, activeTab, setActiveTab, isDarkMode, toggleTheme }: SettingsMobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className={`absolute top-0 left-0 w-full h-full shadow-2xl flex flex-col overflow-y-auto animate-slide-in-left ${
        isDarkMode ? 'bg-black border-r border-[#E70008]/20' : 'bg-white'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${
          isDarkMode ? 'bg-black border-[#E70008]/20' : 'bg-white border-gray-100'
        }`}>
          <Link href="/" className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-[#E70008] flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
             </div>
             <span className="text-lg font-bold tracking-tight">
                <span className="text-[#F4A261]">Magna</span>
                <span className="text-[#E70008]">Coders</span>
             </span>
          </Link>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-gray-100 ${isDarkMode ? 'text-gray-400 hover:bg-[#E70008]/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-6 pb-20">
          <LeftPanel 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            closeMenu={onClose} 
            isMobile={true}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        </div>
      </div>
    </div>
  );
}
