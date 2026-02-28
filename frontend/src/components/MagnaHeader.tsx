import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, PanelLeftOpen } from 'lucide-react';

interface MagnaHeaderProps {
  selectedChat: string | null;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
}

export default function MagnaHeader({ 
  selectedChat, 
  isHistoryOpen, 
  setIsHistoryOpen 
}: MagnaHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Notification Icon (Top Right) */}
      <div className={`absolute top-4 right-4 ${selectedChat ? 'z-0' : 'z-30'}`}>
        <button className="relative p-2 rounded-full hover:bg-gray-200 transition-colors">
          <Bell size={24} className="text-gray-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#E50914] rounded-full"></span>
        </button>
      </div>

      {/* Desktop Back Button (Top Left) */}
      {!selectedChat && (
        <div className="absolute top-4 left-4 z-30 hidden md:block">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            title="Go Back"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
      )}

      {/* Mobile History Toggle (Top Left) */}
      <div className={`absolute top-4 left-4 md:hidden ${selectedChat ? 'z-0' : 'z-30'}`}>
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <PanelLeftOpen size={24} className="text-gray-700" />
        </button>
      </div>
    </>
  );
}
