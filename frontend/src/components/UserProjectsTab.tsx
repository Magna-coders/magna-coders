"use client";

import React, { useState, useEffect } from 'react';
import { Folder, Lock, Globe, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '@/services/apiClient';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  visibility: string;
  category?: string;
  techStack: string[];
  difficulty?: string;
  github?: string;
  image?: string;
  membersCount: number;
  created_at: string;
}

interface UserProjectsTabProps {
  isDarkMode: boolean;
  isOwnProfile: boolean;
  userId?: string;
}

export default function UserProjectsTab({ isDarkMode, isOwnProfile, userId }: UserProjectsTabProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const endpoint = userId ? `/projects/user/${userId}` : '/projects/user';
      const data = await apiFetch<{ success: boolean; projects: Project[] }>(endpoint, {
        method: 'GET'
      });
      setProjects(data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (projectId: string, currentVisibility: string) => {
    setUpdating(projectId);
    try {
      const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
      await apiFetch(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ visibility: newVisibility })
      });
      
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, visibility: newVisibility } : p
      ));
    } catch (error) {
      console.error('Failed to update project visibility:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E70008]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
          <Folder className="w-5 h-5" />
          Projects ({projects.length})
        </h3>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Folder className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-[#F9E4AD]/30' : 'text-gray-300'}`} />
            <p className={`${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
              {isOwnProfile ? 'No projects yet. Create your first project!' : 'No projects to display'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-4 rounded-lg border transition-all ${
                  isDarkMode
                    ? 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#E70008]/50'
                    : 'bg-gray-50 border-gray-200 hover:border-[#E70008]/50'
                }`}
              >
                {/* Project Image */}
                {project.image && (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}

                {/* Project Header */}
                <div className="flex items-start justify-between mb-2">
                  <h4 className={`font-semibold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-[#444444]'}`}>
                    {project.title}
                  </h4>
                  
                  {/* Visibility Badge & Toggle */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                      project.visibility === 'public'
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {project.visibility === 'public' ? (
                        <><Globe className="w-3 h-3" /> Public</>
                      ) : (
                        <><Lock className="w-3 h-3" /> Private</>
                      )}
                    </span>
                    
                    {isOwnProfile && (
                      <button
                        onClick={() => toggleVisibility(project.id, project.visibility)}
                        disabled={updating === project.id}
                        className={`p-1 rounded transition-colors ${
                          isDarkMode
                            ? 'hover:bg-[#2a2a2a] text-[#F9E4AD]/70'
                            : 'hover:bg-gray-200 text-gray-600'
                        } disabled:opacity-50`}
                        title={`Make ${project.visibility === 'public' ? 'private' : 'public'}`}
                      >
                        {project.visibility === 'public' ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Project Description */}
                {project.description && (
                  <p className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? 'text-[#F9E4AD]/70' : 'text-gray-600'}`}>
                    {project.description}
                  </p>
                )}

                {/* Tech Stack */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.techStack.slice(0, 3).map((tech, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded ${
                          isDarkMode
                            ? 'bg-[#2a2a2a] text-[#F9E4AD]/70'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className={`px-2 py-1 text-xs ${isDarkMode ? 'text-[#F9E4AD]/50' : 'text-gray-500'}`}>
                        +{project.techStack.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Project Footer */}
                <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-[#F9E4AD]/50' : 'text-gray-500'}`}>
                  <span className="capitalize">{project.status}</span>
                  <span>{project.membersCount} member{project.membersCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
