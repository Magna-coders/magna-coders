import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import { Podcast } from '@/app/magna-podcast/constants';

interface PodcastPlayerProps {
  podcast: Podcast;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function PodcastPlayer({ podcast, isPlaying, onTogglePlay, onClose, isDarkMode }: PodcastPlayerProps) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 animate-slide-up border-t backdrop-blur-xl shadow-2xl transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-black/80 border-[#E70008]/20 text-white' 
        : 'bg-white/90 border-gray-200 text-gray-900'
    }`}>
      {/* Progress Bar (Visual Only) */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 cursor-pointer group">
        <div className="h-full w-1/3 bg-[#E50914] relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#E50914] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        
        {/* Track Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-gray-100/10">
            <Image 
              src={podcast.image} 
              alt={podcast.title} 
              fill 
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className={`font-bold text-sm md:text-base truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {podcast.title}
            </h4>
            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {podcast.host} • {podcast.role}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-4 md:gap-6">
            <button className={`hidden md:block transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
              <SkipBack size={20} />
            </button>
            
            <button 
              onClick={onTogglePlay}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center hover:bg-[#cc0812] transition-transform active:scale-95 shadow-lg shadow-[#E50914]/20"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            
            <button className={`hidden md:block transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
              <SkipForward size={20} />
            </button>
          </div>
        </div>

        {/* Volume / Extra Controls */}
        <div className="flex items-center justify-end gap-3 flex-1">
           <div className="hidden md:flex items-center gap-2 w-24 group">
              <Volume2 size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <div className="h-1 flex-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full w-2/3 bg-[#E50914]"></div>
              </div>
           </div>
           
           <button 
             onClick={onClose}
             className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
           >
             <X size={20} />
           </button>
        </div>
      </div>
    </div>
  );
}
