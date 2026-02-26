import React from 'react';
import { PlayCircle } from 'lucide-react';

interface VideoPreviewProps {
  isDarkMode?: boolean;
}

export default function VideoPreview({ isDarkMode }: VideoPreviewProps) {
  return (
    <div className={`aspect-video rounded-2xl overflow-hidden relative group cursor-pointer shadow-lg ${isDarkMode ? 'bg-[#111]' : 'bg-black'}`}>
       <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlayCircle size={48} className="text-white fill-white" />
          </div>
       </div>
       <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
         <p className="font-medium">Preview: Course Introduction</p>
         <p className="text-sm text-gray-300">5:00</p>
       </div>
    </div>
  );
}
