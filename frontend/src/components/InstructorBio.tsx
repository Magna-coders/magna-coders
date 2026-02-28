import React from 'react';
import { Star, Users, PlayCircle } from 'lucide-react';
import { Instructor } from '@/app/magna-school/[id]/constants';

interface InstructorBioProps {
  instructor: Instructor;
  isDarkMode?: boolean;
}

export default function InstructorBio({ instructor, isDarkMode }: InstructorBioProps) {
  return (
    <div>
      <h3 className={`font-bold text-xl mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Instructor</h3>
      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#1A1A1A] border-[#333]' : 'bg-white border-gray-100'}`}>
         <div className="flex items-start gap-4 mb-4">
           <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${isDarkMode ? 'bg-[#333] text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
             {instructor.avatar}
           </div>
           <div>
             <h4 className="font-bold text-lg text-[#E50914]">{instructor.name}</h4>
             <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{instructor.role}</p>
             <div className={`flex items-center gap-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
               <div className="flex items-center gap-1">
                 <Star size={12} fill="currentColor" className="text-[#F4A261]" />
                 <span>{instructor.rating} Rating</span>
               </div>
               <div className="flex items-center gap-1">
                 <Users size={12} />
                 <span>{instructor.students.toLocaleString()} Students</span>
               </div>
               <div className="flex items-center gap-1">
                 <PlayCircle size={12} />
                 <span>{instructor.courses} Courses</span>
               </div>
             </div>
           </div>
         </div>
         <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
           {instructor.bio}
         </p>
      </div>
    </div>
  );
}
