import React from 'react';
import { Star, Users, Clock, PlayCircle } from 'lucide-react';
import { CourseDetail } from '@/app/magna-school/[id]/constants';

interface CourseHeaderProps {
  course: CourseDetail;
  isDarkMode?: boolean;
}

export default function CourseHeader({ course, isDarkMode }: CourseHeaderProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-[#E50914]/10 text-[#E50914] text-xs font-bold rounded-full">
          {course.category}
        </span>
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isDarkMode ? 'bg-[#333] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          {course.level}
        </span>
      </div>
      
      <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{course.title}</h1>
      <p className={`text-lg leading-relaxed mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {course.description}
      </p>

      <div className={`flex flex-wrap items-center gap-6 text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <div className="flex items-center gap-1 text-[#F4A261] font-bold">
          <Star size={16} fill="currentColor" />
          <span>{course.rating}</span>
          <span className={`font-normal underline ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>({course.students} ratings)</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{course.students.toLocaleString()} students</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={16} />
          <span>Last updated {course.lastUpdated}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
           <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDarkMode ? 'bg-[#333] text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
             {course.instructor.avatar}
           </div>
           <div>
             <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created by</p>
             <p className={`font-bold hover:underline cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{course.instructor.name}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
