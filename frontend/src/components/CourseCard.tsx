import React from 'react';
import Link from 'next/link';
import { Video, Star, Users, Clock, Award } from 'lucide-react';
import { Course } from '@/app/magna-school/constants';

interface CourseCardProps {
  course: Course;
  isDarkMode: boolean;
  isCompact?: boolean;
  onSelect?: () => void;
}

export default function CourseCard({ course, isDarkMode, isCompact = false, onSelect }: CourseCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect();
    }
  };

  if (isCompact) {
    return (
      <Link href={`/magna-school/${course.id}`} className="block h-full" onClick={handleClick}>
        <div className={`rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all group h-full flex flex-col ${
          isDarkMode 
            ? 'bg-[#111] border-[#E70008]/20' 
            : 'bg-white border-gray-100'
        }`}>
          {/* Compact Thumbnail */}
          <div className={`h-16 relative overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
             <Video size={24} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
             {course.bestseller && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F4A261]" title="Bestseller" />
             )}
          </div>
          
          <div className="p-2 flex-1 flex flex-col min-w-0">
            <div className="mb-1">
               <h3 className={`font-bold text-[10px] leading-tight group-hover:text-[#E50914] transition-colors truncate ${
                 isDarkMode ? 'text-white' : 'text-black'
               }`}>
                 {course.title}
               </h3>
               <p className="text-[9px] text-gray-500 truncate">{course.instructor}</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-between mt-auto gap-1">
               <div className="flex items-center gap-0.5 text-[8px] text-[#F4A261] font-bold">
                 <Star size={8} fill="currentColor" />
                 <span>{course.rating}</span>
               </div>
               <span className={`text-[9px] font-bold truncate ${course.price === 0 ? 'text-[#2ECC71]' : isDarkMode ? 'text-white' : 'text-black'}`}>
                  {course.price === 0 ? 'Free' : `KES ${course.price.toLocaleString()}`}
               </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="block h-full">
      <div className={`rounded-2xl border overflow-hidden hover:shadow-lg transition-all group cursor-pointer flex flex-col h-full ${
        isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'
      }`}>
        {/* Thumbnail */}
        <div className={`aspect-video relative overflow-hidden ${isDarkMode ? 'bg-[#222]' : 'bg-gray-100'}`}>
          <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'text-gray-600 bg-[#222]' : 'text-gray-300 bg-gray-200'}`}>
            <Video size={48} />
          </div>
          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {course.bestseller && (
              <span className="px-2 py-1 rounded bg-[#F4A261] text-white text-[10px] font-bold shadow-sm">
                Bestseller
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-bold line-clamp-2 leading-tight group-hover:text-[#E50914] transition-colors ${isDarkMode ? 'text-[#F9E4AD]' : 'text-gray-900'}`}>
              {course.title}
            </h3>
          </div>

          <p className="text-xs text-gray-500 mb-1">{course.instructor}</p>
          <p className="text-[10px] text-gray-400 mb-3">{course.role}</p>

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1 text-[#F4A261] font-bold">
              <Star size={12} fill="currentColor" />
              <span>{course.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{course.students}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{course.duration}</span>
            </div>
          </div>

          <div className={`mt-auto pt-4 border-t flex items-center justify-between ${isDarkMode ? 'border-[#E70008]/20' : 'border-gray-50'}`}>
            <div className="flex flex-col">
              <span className={`text-lg font-bold ${course.price === 0 ? 'text-[#2ECC71]' : isDarkMode ? 'text-white' : 'text-black'}`}>
                {course.price === 0 ? 'Free' : `KES ${course.price.toLocaleString()}`}
              </span>
              {course.certificate && (
                <div className="flex items-center gap-1 text-[10px] text-[#2ECC71] font-medium">
                  <Award size={10} />
                  <span>Certificate Included</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link 
                href={`/magna-school/${course.id}`}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1 ${
                  isDarkMode ? 'bg-[#333] text-white hover:bg-[#444]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                Learn More
              </Link>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect?.();
                }}
                className="px-4 py-2 rounded-lg bg-[#E50914] text-white text-xs font-bold hover:bg-[#cc0812] transition-colors shadow-sm"
              >
                Enroll
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
