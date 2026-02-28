"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Github, X } from 'lucide-react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import { apiFetch } from '@/services/apiClient';

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    techStack: '',
    membersNeeded: '',
    github: '',
    image: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('Projects');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    fetchCategories();
    if (projectId) fetchProject();
  }, [projectId]);

  const fetchCategories = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
      const res = await fetch(`${apiUrl}/posts/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProject = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/projects/${projectId}`);
      setForm({
        title: data.title || '',
        description: data.description || '',
        category: data.categoryId || '',
        difficulty: data.difficulty || '',
        techStack: Array.isArray(data.techStack) ? data.techStack.join(', ') : '',
        membersNeeded: data.membersNeeded?.toString() || '',
        github: data.github || '',
        image: data.image || '',
      });
      if (data.image) {
        setImagePreview(data.image);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to load project');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setForm(prev => ({ ...prev, image: base64String }));
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiUrl) throw new Error('API URL is not defined');

      const body = {
        title: form.title,
        description: form.description,
        category: form.category,
        difficulty: form.difficulty,
        techStack: form.techStack.split(',').map(t => t.trim()).filter(Boolean),
        membersNeeded: Number(form.membersNeeded),
        github: form.github,
        image: form.image,
      };
      
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch(`${apiUrl}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update project');
      }

      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update project');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
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
          title="Edit Project"
          onMobileMenuOpen={() => {}}
          isDarkMode={isDarkMode}
        />

        <div className="flex-1 overflow-y-auto pt-[65px] md:pt-[80px]">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            
            <Link 
              href={`/projects/${projectId}`}
              className={`inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-[#F9E4AD]' : 'text-gray-600 hover:text-black'
              }`}
            >
              <ArrowLeft size={16} />
              Back to Project
            </Link>

            <form 
              className={`rounded-[24px] p-6 md:p-8 shadow-sm space-y-6 ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`} 
              onSubmit={handleSubmit}
            >
              
              {/* Project Title */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Project Title</label>
                <input 
                  type="text" 
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter project title" 
                  className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
                />
              </div>

              {/* Attach Photo */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Project Image</label>
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Project preview" 
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setForm(prev => ({ ...prev, image: '' }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className={`w-full px-4 py-8 rounded-xl border border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer group ${isDarkMode ? 'bg-[#222] border-gray-700 hover:border-[#E50914]' : 'bg-gray-50 border-gray-300 hover:border-[#E50914]'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-[#333]' : 'bg-white'}`}>
                      <Upload size={20} className="text-gray-400 group-hover:text-[#E50914]" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 group-hover:text-[#E50914]">Click to upload image</span>
                    <span className="text-xs text-gray-400 mt-1">SVG, PNG, JPG (max. 2MB)</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                <textarea 
                  rows={4} 
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe your project..." 
                  className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium resize-none ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                  <div className="relative">
                    <select name="category" value={form.category} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium appearance-none cursor-pointer ${isDarkMode ? 'bg-[#222] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}>
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Difficulty Level</label>
                  <div className="relative">
                    <select name="difficulty" value={form.difficulty} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium appearance-none cursor-pointer ${isDarkMode ? 'bg-[#222] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}>
                      <option value="">Select Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tech Stack (comma separated)</label>
                <input 
                  type="text" 
                  name="techStack"
                  value={form.techStack}
                  onChange={handleChange}
                  placeholder="React, Node.js, MongoDB..." 
                  className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
                />
              </div>

              {/* Team Size Needed */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Team Size Needed</label>
                <input 
                  type="number" 
                  min="1"
                  name="membersNeeded"
                  value={form.membersNeeded}
                  onChange={handleChange}
                  placeholder="e.g. 3" 
                  className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
                />
              </div>

              {/* GitHub Link */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>GitHub Repository (Optional)</label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="url" 
                    name="github"
                    value={form.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username/repo" 
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <Link
                  href={`/projects/${projectId}`}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#222]' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                >
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={saving}
                  className={`px-8 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-[#E50914]/20 transition-all hover:shadow-[#E50914]/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#F4A261] to-[#E50914]`}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
