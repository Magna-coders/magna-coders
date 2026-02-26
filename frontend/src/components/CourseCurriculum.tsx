import React, { useState } from 'react';
import { MonitorPlay, FileText } from 'lucide-react';
import { CurriculumSection } from '@/app/magna-school/[id]/constants';

interface CourseCurriculumProps {
  curriculum: CurriculumSection[];
  totalVideos: number;
  totalDuration: string;
  isDarkMode?: boolean;
}

export default function CourseCurriculum({ curriculum, totalVideos, totalDuration, isDarkMode }: CourseCurriculumProps) {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div>
      <h3 className={`font-bold text-xl mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Course Content</h3>
      <div className={`flex items-center gap-2 text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <span>{curriculum.length} sections</span>
        <span>•</span>
        <span>{totalVideos} lectures</span>
        <span>•</span>
        <span>{totalDuration} total length</span>
      </div>

      <div className={`border rounded-xl overflow-hidden ${isDarkMode ? 'bg-[#1A1A1A] border-[#333]' : 'bg-white border-gray-200'}`}>
        {curriculum.map((section, idx) => (
          <div key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-[#333]' : 'border-gray-100'}`}>
            <button 
              onClick={() => setActiveSection(activeSection === idx ? -1 : idx)}
              className={`w-full px-6 py-4 flex items-center justify-between transition-colors text-left ${isDarkMode ? 'bg-[#222] hover:bg-[#333]' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`transform transition-transform ${activeSection === idx ? 'rotate-180' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{section.title}</span>
              </div>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{section.videos} lectures • {section.duration}</span>
            </button>
            
            {activeSection === idx && (
              <div className={isDarkMode ? 'bg-[#1A1A1A]' : 'bg-white'}>
                {section.lessons.map((lesson, lIdx) => (
                  <div key={lIdx} className={`px-6 py-3 flex items-center justify-between transition-colors cursor-pointer group ${isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      {lesson.type === 'video' ? (
                        <MonitorPlay size={16} className={`group-hover:text-[#E50914] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      ) : (
                        <FileText size={16} className={`group-hover:text-[#E50914] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      )}
                      <span className={`text-sm transition-colors ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-black'}`}>
                        {lesson.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {lesson.isFree && (
                        <span className="text-xs text-[#E50914] font-medium">Preview</span>
                      )}
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{lesson.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
