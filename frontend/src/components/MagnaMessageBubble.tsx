'use client';

import React, { useState } from 'react';
import { Edit, Loader2, Lock } from 'lucide-react';
import JobCard, { Job } from './JobCard';
import BuilderCard, { Builder } from './BuilderCard';
import ProjectCard, { Project } from './ProjectCard';
import CourseCard from './CourseCard';
import { Course } from '@/app/magna-school/constants';

export interface MessageBubbleProps {
  id?: string;
  sender: string;
  text: string;
  time: string;
  avatar: string | React.ReactNode;
  color?: string;
  isMe?: boolean;
  onEdit?: (id: string, newText: string) => void;
  isDarkMode?: boolean;
  jobResults?: Job[];
  builderResults?: Builder[];
  projectResults?: Project[];
  schoolResults?: Course[];
  isLoading?: boolean;
  loadingIcon?: React.ReactNode;
  onViewMore?: () => void;
}

export default function MagnaMessageBubble({ 
  id, 
  sender, 
  text, 
  time, 
  avatar, 
  color, 
  isMe = false, 
  onEdit, 
  isDarkMode = false,
  jobResults,
  builderResults,
  projectResults,
  schoolResults,
  isLoading,
  loadingIcon,
  onViewMore
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleSave = () => {
    if (onEdit && id) {
      onEdit(id, editedText);
      setIsEditing(false);
    }
  };

  if (isMe) {
    return (
      <div className="flex flex-col items-end max-w-[80%] ml-auto group">
        <div className="bg-[#E50914] text-white p-4 rounded-2xl rounded-tr-none shadow-md relative">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea 
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="bg-white/10 text-white p-2 rounded w-full min-w-[200px] outline-none border border-white/20"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30">Cancel</button>
                <button onClick={handleSave} className="text-xs bg-white text-[#E50914] px-2 py-1 rounded font-bold hover:bg-gray-100">Save</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed">{text}</p>
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full text-gray-500"
                title="Edit message"
              >
                <Edit size={14} />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 mr-1">
          <span className="text-[10px] text-gray-400 font-medium">{time}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 max-w-[80%]">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${color || (isDarkMode ? 'bg-[#222] text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
        {typeof avatar === 'string' ? avatar : avatar}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2 ml-1">
          <span className={`text-xs font-bold ${color ? color.split(' ')[1] : (isDarkMode ? 'text-gray-400' : 'text-gray-700')}`}>{sender}</span>
        </div>
        <div className={`p-4 rounded-2xl rounded-tl-none ${isDarkMode ? 'bg-transparent text-gray-200' : 'bg-transparent text-gray-700'}`}>
          {!isLoading && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {text.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-[#E50914]">
               {loadingIcon ? (
                 <div className="relative w-5 h-5 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-full border-2 border-[#E50914] border-t-transparent animate-spin" />
                   {loadingIcon}
                 </div>
               ) : (
                 <Loader2 className="animate-spin" size={20} />
               )}
               <span className="text-sm font-medium">{text}</span>
            </div>
          )}

          {jobResults && jobResults.length > 0 && (
             <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
                {jobResults.slice(0, 5).map(job => (
                   <div key={job.id} className="h-full">
                       <div className="hidden md:block h-full">
                           <JobCard job={job} isDarkMode={isDarkMode} isCompact={false} />
                       </div>
                       <div className="block md:hidden h-full">
                           <JobCard job={job} isDarkMode={isDarkMode} isCompact={true} />
                       </div>
                   </div>
                ))}
                
                {onViewMore && (
                    <button 
                        onClick={onViewMore}
                        className="col-span-3 w-full py-3 mt-2 rounded-xl border border-dashed border-[#E50914]/50 flex items-center justify-center gap-2 hover:bg-[#E50914]/5 transition-colors group"
                    >
                        <Lock size={16} className="text-[#E50914]" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} group-hover:text-[#E50914]`}>View More</span>
                    </button>
                )}
             </div>
          )}
          {builderResults && builderResults.length > 0 && (
             <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
                {builderResults.slice(0, 5).map(builder => (
                   <div key={builder.id} className="h-full">
                       <div className="hidden md:block h-full">
                           <BuilderCard builder={builder} isDarkMode={isDarkMode} isCompact={false} />
                       </div>
                       <div className="block md:hidden h-full">
                           <BuilderCard builder={builder} isDarkMode={isDarkMode} isCompact={true} />
                       </div>
                   </div>
                ))}
                
                {onViewMore && (
                    <button 
                        onClick={onViewMore}
                        className="col-span-3 w-full py-3 mt-2 rounded-xl border border-dashed border-[#E50914]/50 flex items-center justify-center gap-2 hover:bg-[#E50914]/5 transition-colors group"
                    >
                        <Lock size={16} className="text-[#E50914]" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} group-hover:text-[#E50914]`}>View More</span>
                    </button>
                )}
             </div>
          )}
          {projectResults && projectResults.length > 0 && (
             <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
                {projectResults.slice(0, 5).map(project => (
                   <div key={project.id} className="h-full">
                       <div className="hidden md:block h-full">
                           <ProjectCard project={project} isDarkMode={isDarkMode} isCompact={false} />
                       </div>
                       <div className="block md:hidden h-full">
                           <ProjectCard project={project} isDarkMode={isDarkMode} isCompact={true} />
                       </div>
                   </div>
                ))}
                
                {onViewMore && (
                    <button 
                        onClick={onViewMore}
                        className="col-span-3 w-full py-3 mt-2 rounded-xl border border-dashed border-[#E50914]/50 flex items-center justify-center gap-2 hover:bg-[#E50914]/5 transition-colors group"
                    >
                        <Lock size={16} className="text-[#E50914]" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} group-hover:text-[#E50914]`}>View More</span>
                    </button>
                )}
             </div>
          )}
          {schoolResults && schoolResults.length > 0 && (
             <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
                {schoolResults.slice(0, 5).map(course => (
                   <div key={course.id} className="h-full">
                       <div className="hidden md:block h-full">
                           <CourseCard course={course} isDarkMode={isDarkMode} isCompact={false} />
                       </div>
                       <div className="block md:hidden h-full">
                           <CourseCard course={course} isDarkMode={isDarkMode} isCompact={true} />
                       </div>
                   </div>
                ))}
                
                {onViewMore && (
                    <button 
                        onClick={onViewMore}
                        className="col-span-3 w-full py-3 mt-2 rounded-xl border border-dashed border-[#E50914]/50 flex items-center justify-center gap-2 hover:bg-[#E50914]/5 transition-colors group"
                    >
                        <Lock size={16} className="text-[#E50914]" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} group-hover:text-[#E50914]`}>View More</span>
                    </button>
                )}
             </div>
          )}
        </div>
        <span className="text-[10px] text-gray-400 font-medium ml-1">{time}</span>
      </div>
    </div>
  );
}
