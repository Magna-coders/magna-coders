"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Users, Calendar, MapPin, Github, 
  Edit, Trash2, UserPlus, Upload, Plus, CheckCircle,
  Clock, FileText, Activity
} from 'lucide-react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import AddMemberModal from '@/components/AddMemberModal';
import { apiFetch } from '@/services/apiClient';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  techStack: string[];
  difficulty: string;
  github: string;
  image: string;
  location: string;
  membersNeeded: number;
  teamCount: number;
  members: any[];
  owner: any;
  deadline: string;
  visibility: string;
  created_at: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('Projects');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  
  // Tab-specific state
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  
  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'todo' });
  const [uploadFile, setUploadFile] = useState<{ filename: string; url: string; mimeType: string; size: number } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (projectId && activeDetailTab !== 'overview') {
      fetchTabData();
    }
  }, [projectId, activeDetailTab]);

  const fetchTabData = async () => {
    setLoadingTab(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      switch (activeDetailTab) {
        case 'members':
          const membersRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/members`, { headers });
          if (membersRes.ok) {
            const data = await membersRes.json();
            setMembers(data.members || []);
          }
          break;
        case 'tasks':
          const tasksRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/tasks`, { headers });
          if (tasksRes.ok) {
            const data = await tasksRes.json();
            setTasks(data.tasks || []);
          }
          break;
        case 'files':
          const filesRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/files`, { headers });
          if (filesRes.ok) {
            const data = await filesRes.json();
            setFiles(data.files || []);
          }
          break;
        case 'activity':
          const activityRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/activity`, { headers });
          if (activityRes.ok) {
            const data = await activityRes.json();
            setActivity(data.activity || []);
          }
          break;
      }
    } catch (err) {
      console.error('Failed to fetch tab data:', err);
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Project>(`/projects/${projectId}`);
      setProject(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is the project owner
  const getCurrentUserId = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();
  const isOwner = project && currentUserId && project.owner?.id === currentUserId;

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
      router.push('/projects');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete project');
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: 'member' })
      });
      
      if (res.ok) {
        setShowAddMemberModal(false);
        fetchTabData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add member');
      }
    } catch (err) {
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the project?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchTabData();
      }
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });
      
      if (res.ok) {
        setShowAddTaskModal(false);
        setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
        fetchTabData();
      }
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchTabData();
      }
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadFile({
        filename: file.name,
        url: reader.result as string,
        mimeType: file.type,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadFile = async () => {
    if (!uploadFile) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(uploadFile)
      });
      
      if (res.ok) {
        setShowUploadFileModal(false);
        setUploadFile(null);
        fetchTabData();
      }
    } catch (err) {
      alert('Failed to upload file');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchTabData();
      }
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E50914] mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Project not found'}</p>
          <Link href="/projects" className="text-[#E50914] hover:underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      <LeftPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      <div className={`flex-1 flex flex-col h-full overflow-hidden relative md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300`}>
        
        <TopNavigation 
          title={project.title}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          isDarkMode={isDarkMode}
        />

        <div className="flex-1 overflow-y-auto pt-[65px] md:pt-[80px]">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            
            {/* Back Button */}
            <Link 
              href="/projects"
              className={`inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-[#F9E4AD]' : 'text-gray-600 hover:text-black'
              }`}
            >
              <ArrowLeft size={16} />
              Back to Projects
            </Link>

            {/* Project Header */}
            <div className={`rounded-2xl p-6 md:p-8 border shadow-sm mb-6 ${
              isDarkMode ? 'bg-[#111] border-[#E70008]/30' : 'bg-white border-gray-100'
            }`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                      {project.title}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      project.status === 'in-progress' 
                        ? isDarkMode ? 'bg-[#E70008]/10 text-[#E70008] border-[#E70008]/30' : 'bg-[#E50914]/5 text-[#E50914] border-[#E50914]/20'
                        : isDarkMode ? 'bg-[#FF9940]/10 text-[#FF9940] border-[#FF9940]/30' : 'bg-[#F4A261]/10 text-[#d98236] border-[#F4A261]/20'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className={`text-base leading-relaxed mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    {project.category && (
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#E50914]" />
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {project.category}
                        </span>
                      </div>
                    )}
                    {project.difficulty && (
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-[#FF9940]" />
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {project.difficulty}
                        </span>
                      </div>
                    )}
                    {project.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#E50914]" />
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {project.location}
                        </span>
                      </div>
                    )}
                    {project.github && (
                      <a 
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#E50914] hover:underline"
                      >
                        <Github size={16} />
                        Repository
                      </a>
                    )}
                  </div>
                </div>

                {project.image && (
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full md:w-48 h-48 object-cover rounded-xl"
                  />
                )}
              </div>

              {/* Action Buttons - Only show for owner */}
              {isOwner && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => router.push(`/projects/${projectId}/edit`)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#E50914] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#cc0812] transition-colors"
                  >
                    <Edit size={16} />
                    Edit Project
                  </button>
                  <button 
                    onClick={handleDelete}
                    className={`flex items-center gap-2 px-6 py-2.5 border rounded-xl font-bold text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-transparent border-[#E70008]/40 text-[#F9E4AD] hover:bg-[#E70008]/10' 
                        : 'bg-white border-gray-200 text-black hover:bg-gray-50'
                    }`}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className={`flex items-center gap-6 border-b mb-6 overflow-x-auto ${
              isDarkMode ? 'border-[#E70008]/20' : 'border-gray-200'
            }`}>
              {['overview', 'members', 'tasks', 'files', 'activity'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`pb-4 px-2 text-sm font-bold whitespace-nowrap relative transition-colors capitalize ${
                    activeDetailTab === tab 
                      ? 'text-[#E50914]' 
                      : isDarkMode ? 'text-gray-500 hover:text-[#F9E4AD]' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                  {activeDetailTab === tab && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E50914] rounded-t-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-6">
                {/* Tech Stack */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className={`rounded-2xl p-6 border ${
                    isDarkMode ? 'bg-[#111] border-[#E70008]/30' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                      Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech: string) => (
                        <span key={tech} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                          isDarkMode 
                            ? 'bg-[#222] text-gray-300 border-gray-800' 
                            : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Info */}
                <div className={`rounded-2xl p-6 border ${
                  isDarkMode ? 'bg-[#111] border-[#E70008]/30' : 'bg-white border-gray-100'
                }`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                    Team Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Current Members
                      </p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                        {project.teamCount}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Members Needed
                      </p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                        {project.membersNeeded}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDetailTab === 'members' && (
              <div className={`rounded-2xl p-6 border ${
                isDarkMode ? 'bg-[#111] border-[#E70008]/30' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                    Team Members ({members.length})
                  </h3>
                  {isOwner && (
                    <button 
                      onClick={() => setShowAddMemberModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#E50914] text-white rounded-xl font-bold text-sm hover:bg-[#cc0812] transition-colors"
                    >
                      <UserPlus size={16} />
                      Add Member
                    </button>
                  )}
                </div>
                
                {loadingTab ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E50914] mx-auto"></div>
                  </div>
                ) : members.length === 0 ? (
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No members yet. Add members to collaborate on this project.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member: any) => {
                      const isMemberOwner = project && member.user_id === project.owner?.id;
                      return (
                        <div key={member.user_id} className={`flex items-center justify-between p-4 rounded-xl border ${
                          isDarkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-gray-50 border-gray-100'
                        }`}>
                          <div className="flex items-center gap-3">
                            {member.users?.avatar_url ? (
                              <img src={member.users.avatar_url} alt={member.users.username} className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold">
                                {member.users?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {member.users?.username || 'Unknown User'}
                                {isMemberOwner && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-[#E70008] text-white rounded">Owner</span>
                                )}
                              </h4>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {member.role || 'Member'}
                              </p>
                            </div>
                          </div>
                          {!isMemberOwner && isOwner && (
                            <button 
                              onClick={() => handleRemoveMember(member.user_id)}
                              className="text-red-500 hover:text-red-600 text-sm font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'tasks' && (
              <div className={`rounded-2xl p-6 border ${
                isDarkMode ? 'bg-[#111] border-[#E70008]/30' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                    Tasks ({tasks.length})
                  </h3>
                  <button 
                    onClick={() => setShowAddTaskModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E50914] text-white rounded-xl font-bold text-sm hover:bg-[#cc0812] transition-colors"
                  >
                    <Plus size={16} />
                    New Task
                  </button>
                </div>
                
                {loadingTab ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E50914] mx-auto"></div>
                  </div>
                ) : tasks.length === 0 ? (
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No tasks yet. Create tasks to track project progress.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task: any) => (
                      <div key={task.id} className={`p-4 rounded-xl border ${
                        isDarkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {task.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                task.status === 'done' 
                                  ? 'bg-green-500/10 text-green-500' 
                                  : task.status === 'in-progress'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-gray-500/10 text-gray-500'
                              }`}>
                                {task.status}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                task.priority === 'high' 
                                  ? 'bg-red-500/10 text-red-500' 
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-500/10 text-yellow-500'
                                  : 'bg-gray-500/10 text-gray-500'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'files' && (
              <div className={`rounded-2xl p-6 border ${
                isDarkMode ? 'bg-[#111] border-[#E70008]/30' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                    Files ({files.length})
                  </h3>
                  <button 
                    onClick={() => setShowUploadFileModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E50914] text-white rounded-xl font-bold text-sm hover:bg-[#cc0812] transition-colors"
                  >
                    <Upload size={16} />
                    Upload File
                  </button>
                </div>
                
                {loadingTab ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E50914] mx-auto"></div>
                  </div>
                ) : files.length === 0 ? (
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No files uploaded yet. Upload files to share with your team.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {files.map((file: any) => (
                      <div key={file.id} className={`p-4 rounded-xl border ${
                        isDarkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <FileText size={20} className="text-[#E50914] flex-shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {file.filename}
                              </h4>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-500 hover:text-red-600 text-sm flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'activity' && (
              <div className={`rounded-2xl p-6 border ${
                isDarkMode ? 'bg-[#111] border-[#E70008]/30' : 'bg-white border-gray-100'
              }`}>
                <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
                  Activity Log
                </h3>
                
                {loadingTab ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E50914] mx-auto"></div>
                  </div>
                ) : activity.length === 0 ? (
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No activity yet. Project events will appear here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activity.map((event: any) => (
                      <div key={event.id} className={`flex gap-3 p-4 rounded-xl border ${
                        isDarkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <Activity size={16} className="text-[#E50914] flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            <span className="font-bold">{event.users?.username || 'Someone'}</span> {event.event_type}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        isDarkMode={isDarkMode}
        ownerId={project?.owner?.id}
      />

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full ${
            isDarkMode ? 'bg-[#111] border border-[#E70008]/30' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
              Create New Task
            </h3>
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border mb-3 ${
                isDarkMode 
                  ? 'bg-[#222] border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-200 text-black'
              }`}
            />
            <textarea
              placeholder="Task description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border mb-3 resize-none ${
                isDarkMode 
                  ? 'bg-[#222] border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-200 text-black'
              }`}
            />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className={`px-4 py-3 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-[#222] border-gray-700 text-white' 
                    : 'bg-gray-50 border-gray-200 text-black'
                }`}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                className={`px-4 py-3 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-[#222] border-gray-700 text-white' 
                    : 'bg-gray-50 border-gray-200 text-black'
                }`}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddTaskModal(false);
                  setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
                }}
                className={`flex-1 px-4 py-2 rounded-xl font-bold ${
                  isDarkMode ? 'bg-[#222] text-white' : 'bg-gray-100 text-black'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 rounded-xl font-bold bg-[#E50914] text-white hover:bg-[#cc0812]"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadFileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full ${
            isDarkMode ? 'bg-[#111] border border-[#E70008]/30' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
              Upload File
            </h3>
            <label className={`w-full px-4 py-8 rounded-xl border border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer group mb-4 ${
              isDarkMode 
                ? 'bg-[#222] border-gray-700 hover:border-[#E50914]' 
                : 'bg-gray-50 border-gray-300 hover:border-[#E50914]'
            }`}>
              <Upload size={32} className="text-gray-400 group-hover:text-[#E50914] mb-2" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#E50914]">
                {uploadFile ? uploadFile.filename : 'Click to select file'}
              </span>
              <span className="text-xs text-gray-400 mt-1">Max 10MB</span>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUploadFileModal(false);
                  setUploadFile(null);
                }}
                className={`flex-1 px-4 py-2 rounded-xl font-bold ${
                  isDarkMode ? 'bg-[#222] text-white' : 'bg-gray-100 text-black'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFile}
                disabled={!uploadFile}
                className="flex-1 px-4 py-2 rounded-xl font-bold bg-[#E50914] text-white hover:bg-[#cc0812] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
