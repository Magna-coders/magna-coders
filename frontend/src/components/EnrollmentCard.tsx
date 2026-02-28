import React, { useState } from 'react';
import { Heart, Share2, MonitorPlay, Download, Clock, Users, Award } from 'lucide-react';
import { CourseDetail } from '@/app/magna-school/[id]/constants';

interface EnrollmentCardProps {
  course: CourseDetail;
  isDarkMode?: boolean;
}

export default function EnrollmentCard({ course, isDarkMode }: EnrollmentCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className={`rounded-2xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-[#1A1A1A] border-[#333]' : 'bg-white border-gray-100'}`}>
      <div className="p-6">
        <div className="mb-6">
          <span className={`text-3xl font-bold ${course.price === 0 ? 'text-[#2ECC71]' : (isDarkMode ? 'text-white' : 'text-black')}`}>
            {course.price === 0 ? 'Free' : `KES ${course.price.toLocaleString()}`}
          </span>
          {course.price > 0 && (
             <span className="block text-sm text-gray-400 line-through mt-1">KES {(course.price * 1.5).toLocaleString()}</span>
          )}
        </div>
        
        <button className="w-full py-3 rounded-xl bg-[#E50914] text-white font-bold text-lg hover:bg-[#cc0812] transition-colors shadow-lg shadow-[#E50914]/20 mb-3">
          {course.price === 0 ? 'Enroll Now' : 'Buy Now'}
        </button>
        <p className="text-center text-xs text-gray-400 mb-6">30-Day Money-Back Guarantee</p>
        
        <div className="space-y-4">
          <h4 className={`font-bold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>This course includes:</h4>
          {course.features.map((feature, idx) => (
            <div key={idx} className={`flex items-center gap-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {idx === 0 ? <MonitorPlay size={16} /> : 
               idx === 1 ? <Download size={16} /> :
               idx === 2 ? <Clock size={16} /> :
               idx === 3 ? <Users size={16} /> :
               <Award size={16} />}
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`px-6 py-4 border-t flex justify-between items-center ${isDarkMode ? 'bg-[#222] border-[#333]' : 'bg-gray-50 border-gray-100'}`}>
         <button 
           onClick={() => setIsLiked(!isLiked)}
           className={`font-bold text-sm hover:text-black flex items-center gap-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}
         >
           <Heart size={18} className={isLiked ? "fill-[#E50914] text-[#E50914]" : ""} />
           {isLiked ? 'Saved' : 'Save'}
         </button>
         <button className={`font-bold text-sm hover:text-black flex items-center gap-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}>
           <Share2 size={18} />
           Share
         </button>
      </div>
    </div>
  );
}
