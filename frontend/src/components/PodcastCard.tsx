import React from 'react';
import { Play, Pause, Clock, Calendar, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import { Podcast } from '@/app/magna-podcast/constants';

interface PodcastCardProps {
  podcast: Podcast;
  isPlaying: boolean;
  onTogglePlay: (id: number) => void;
  isDarkMode: boolean;
}

export default function PodcastCard({ podcast, isPlaying, onTogglePlay, isDarkMode }: PodcastCardProps) {
  return (
    <div className={`group rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl ${isDarkMode ? 'bg-[#111] border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:shadow-gray-200/50'}`}>
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden">
        <Image 
          src={podcast.image} 
          alt={podcast.title} 
          fill 
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        
        <div className="absolute top-4 left-4 flex gap-2">
          {podcast.tags.map(tag => (
            <span key={tag} className="px-2 py-1 rounded-md bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wide border border-white/10">
              {tag}
            </span>
          ))}
        </div>

        <button 
          onClick={() => onTogglePlay(podcast.id)}
          className={`absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all transform group-hover:scale-110 shadow-lg ${isPlaying ? 'bg-[#E50914] text-white' : 'bg-white text-black'}`}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </button>

        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center gap-2 text-xs font-medium opacity-80 mb-1">
            <Clock size={12} />
            <span>{podcast.duration}</span>
            <span>•</span>
            <Calendar size={12} />
            <span>{podcast.date}</span>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5">
        <h3 className={`text-xl font-bold mb-2 line-clamp-1 group-hover:text-[#E50914] transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {podcast.title}
        </h3>
        <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {podcast.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-200/20">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {podcast.host.charAt(0)}
            </div>
            <div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{podcast.host}</p>
              <p className="text-[10px] text-gray-500">{podcast.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-400">
            <button className="hover:text-[#E50914] transition-colors"><Heart size={18} /></button>
            <button className="hover:text-[#F4A261] transition-colors"><Share2 size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
