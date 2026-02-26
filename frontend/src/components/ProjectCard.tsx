import React from 'react';
import { Users, Calendar, MapPin } from 'lucide-react';

export interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  level: string;
  techStack: string[];
  teamCount: number;
  date: string;
  image: null | string;
  location?: string;
}

interface ProjectCardProps {
  project: Project;
  showActions?: boolean;
  isDarkMode?: boolean;
  isCompact?: boolean;
}

export default function ProjectCard({ project, showActions = true, isDarkMode = false, isCompact = false }: ProjectCardProps) {
  if (isCompact) {
    return (
      <div className={`rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all group h-full flex flex-col ${
        isDarkMode 
          ? 'bg-[#111] border-[#E70008]/20' 
          : 'bg-white border-gray-100'
      }`}>
        <div className={`h-16 relative overflow-hidden flex items-center justify-center ${
            project.category === 'Blockchain' ? 'bg-blue-600' :
            project.category === 'Health Tech' ? 'bg-green-600' :
            project.category === 'IoT' ? 'bg-purple-600' :
            project.category === 'AI/ML' ? 'bg-indigo-600' : 'bg-gray-600'
        }`}>
          <span className="text-white font-bold text-xl">{project.title.charAt(0)}</span>
        </div>
        
        <div className="p-2 flex-1 flex flex-col min-w-0">
          <div className="mb-1">
             <h3 className={`font-bold text-[10px] leading-tight group-hover:text-[#E50914] transition-colors truncate ${
               isDarkMode ? 'text-white' : 'text-black'
             }`}>
               {project.title}
             </h3>
             <p className="text-[9px] text-gray-500 truncate">{project.category}</p>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-auto">
             <span className="text-[8px] px-1.5 py-0.5 bg-[#E50914]/5 text-[#E50914] rounded font-medium truncate">
               {project.status}
             </span>
             {project.location && (
               <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 truncate max-w-full">
                 {project.location}
               </span>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all group ${
        isDarkMode ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-100'
    }`}>
      {/* Card Header */}
      <div className="flex flex-col gap-3 mb-4">
        <h2 className={`text-xl font-bold group-hover:text-[#E50914] transition-colors leading-tight ${
            isDarkMode ? 'text-white' : 'text-black'
        }`}>
          {project.title}
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap ${
            project.status === 'in-progress' ? 'bg-[#E50914]/5 text-[#E50914] border-[#E50914]/20' : 
            project.status === 'open' ? 'bg-[#F4A261]/10 text-[#d98236] border-[#F4A261]/20' : 
            'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            {project.status}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-200 whitespace-nowrap">
            {project.level}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
        {project.description}
      </p>

      {/* Category */}
      <div className="mb-6">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Category</span>
        <span className="text-sm font-bold text-[#F4A261]">{project.category}</span>
      </div>

      {/* Tech Stack */}
      <div className="mb-6">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tech Stack</span>
        <div className="flex flex-wrap gap-2">
          {project.techStack.map(tech => (
            <span key={tech} className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-100">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-gray-400 font-medium mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>Team: {project.teamCount} members</span>
          </div>
          {project.location && (
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>{project.location}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>{project.date}</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-3">
          <button className="flex-1 py-2.5 bg-[#E50914] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#cc0812] transition-colors">
            Edit
          </button>
          <button className="flex-1 py-2.5 bg-white border border-gray-200 text-black rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
