import React from 'react';
import Link from 'next/link';
import { TRENDING_PROJECTS } from '@/app/projects/data';
import { Edit, Trash2, ArrowRight } from 'lucide-react';

export default function MyProjectsSettings({ isDarkMode }: { isDarkMode?: boolean }) {
  // Use a subset of trending projects as mock "My Projects"
  const myProjects = TRENDING_PROJECTS.slice(0, 3);

  return (
    <div className={`rounded-[24px] p-6 md:p-8 shadow-sm ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>My Projects</h2>
        <button className="px-4 py-2 bg-[#E50914] text-white text-sm font-bold rounded-full hover:bg-[#cc0812] transition-colors shadow-md">
          New Project
        </button>
      </div>
      
      <div className="space-y-4 mb-6">
        {myProjects.map((project) => (
          <div key={project.id} className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>{project.title}</h3>
                <p className={`text-sm mt-1 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{project.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {project.techStack.slice(0, 3).map((tag: string) => (
                    <span key={tag} className={`text-xs px-2 py-1 rounded-md font-medium ${isDarkMode ? 'bg-[#333] text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333]' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}>
                  <Edit size={16} />
                </button>
                <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-red-500 hover:bg-[#333]' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className={`mt-4 pt-4 border-t flex justify-between items-center text-xs ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
              <span>Last updated 2 days ago</span>
              <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'}`}>Active</span>
            </div>
          </div>
        ))}
      </div>

      <Link 
        href="/my-projects" 
        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
          isDarkMode 
            ? 'bg-[#222] text-white hover:bg-[#333] border border-gray-700' 
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        View All Projects
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
