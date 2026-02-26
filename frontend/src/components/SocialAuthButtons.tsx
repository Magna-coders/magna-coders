import React from 'react';
import { Chrome, Github } from 'lucide-react';

interface SocialAuthButtonsProps {
  isDarkMode: boolean;
  onGoogleClick?: () => void;
  onGithubClick?: () => void;
}

export default function SocialAuthButtons({ isDarkMode, onGoogleClick, onGithubClick }: SocialAuthButtonsProps) {
  const btnClass = isDarkMode 
    ? "bg-white/5 hover:bg-white/10 text-white" 
    : "bg-white/60 hover:bg-white/80 text-black";

  return (
    <div className="grid grid-cols-2 gap-4">
      <button 
        type="button" 
        onClick={onGoogleClick}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-full border border-transparent transition-all ${btnClass}`}
      >
        <Chrome className="w-5 h-5" />
        <span className="font-medium text-sm">Google</span>
      </button>
      <button 
        type="button" 
        onClick={onGithubClick}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-full border border-transparent transition-all ${btnClass}`}
      >
        <Github className="w-5 h-5" />
        <span className="font-medium text-sm">GitHub</span>
      </button>
    </div>
  );
}
