import React from 'react';
import { Mic, User } from 'lucide-react';
import Image from 'next/image';

interface PodcastHeroProps {
  isDarkMode: boolean;
}

export default function PodcastHero({ isDarkMode }: PodcastHeroProps) {
  return (
    <div className={`w-full rounded-3xl overflow-hidden mb-10 relative ${isDarkMode ? 'bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] border border-[#E70008]/20' : 'bg-gradient-to-r from-[#222] to-[#111] text-white shadow-xl'}`}>
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 bg-[url('https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#E50914] rounded-full blur-[100px] opacity-30"></div>
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#F4A261] rounded-full blur-[100px] opacity-20"></div>

      <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E50914]/20 border border-[#E50914]/30 text-[#E50914] text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse"></span>
            Live Now
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4A261] to-[#E50914]">Magna Podcast</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-xl">
            Connect with industry leaders, discuss cutting-edge tech, and share your journey with the global developer community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button className="px-8 py-3.5 rounded-full bg-[#E50914] text-white font-bold hover:bg-[#cc0812] transition-all shadow-lg hover:shadow-[#E50914]/30 flex items-center justify-center gap-2 group">
              <Mic size={20} />
              Start Listening
            </button>
            <button className={`px-8 py-3.5 rounded-full font-bold border-2 transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white' : 'border-white/20 text-white hover:bg-white/10'}`}>
              <User size={20} />
              Become a Guest
            </button>
          </div>
        </div>
        <div className="relative w-full max-w-sm aspect-square md:aspect-auto md:h-80 flex items-center justify-center">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 rounded-full border-2 border-[#E50914]/30 animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-4 rounded-full border-2 border-[#F4A261]/30 animate-[spin_15s_linear_infinite_reverse]"></div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gradient-to-br from-[#111] to-[#222] shadow-2xl border border-gray-800">
              <Mic size={80} className="text-white drop-shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
            </div>
            
            {/* Floating Avatars */}
            <div className="absolute top-0 right-10 w-12 h-12 rounded-full border-2 border-[#111] overflow-hidden shadow-lg animate-bounce delay-75">
              <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="User" width={48} height={48} className="object-cover" />
            </div>
            <div className="absolute bottom-4 left-4 w-10 h-10 rounded-full border-2 border-[#111] overflow-hidden shadow-lg animate-bounce delay-150">
              <Image src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100" alt="User" width={40} height={40} className="object-cover" />
            </div>
            <div className="absolute bottom-10 right-0 w-14 h-14 rounded-full border-2 border-[#111] overflow-hidden shadow-lg animate-bounce delay-300">
              <Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="User" width={56} height={56} className="object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
