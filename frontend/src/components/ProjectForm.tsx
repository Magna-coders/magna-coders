import React, { useState } from 'react';
import { Upload, Github, FolderKanban, Check, Loader2 } from 'lucide-react';

interface ProjectFormProps {
  onCancel: () => void;
  isDarkMode: boolean;
  onSuccess?: () => void;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  topics: string[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function ProjectForm({ onCancel, isDarkMode, onSuccess }: ProjectFormProps) {
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    techStack: '',
    membersNeeded: '',
    github: '',
    image: '', // Store base64 image
  });
  const [loading, setLoading] = React.useState(false);
  const [fetchingRepos, setFetchingRepos] = React.useState(false);
  const [repos, setRepos] = React.useState<GitHubRepo[]>([]);
  const [showRepoModal, setShowRepoModal] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);

  // Fetch categories on mount
  React.useEffect(() => {
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
    fetchCategories();
  }, []);

  const fetchGithubRepos = async () => {
    setFetchingRepos(true);
    try {
        // In a real app, you'd call your backend which proxies to GitHub API using the user's stored token
        // const res = await fetch('/api/integrations/social/github/repos');
        
        // For demonstration, we'll mock a fetch or use public GitHub API if user provides username
        // Since we don't have the user's GitHub username handy in this component's props, 
        // we'll simulate a response or ask for username.
        
        // Simulating response
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockRepos: GitHubRepo[] = [
            {
                id: 1,
                name: "magna-coders",
                full_name: "username/magna-coders",
                description: "A platform for developers to connect and build projects.",
                html_url: "https://github.com/username/magna-coders",
                language: "TypeScript",
                topics: ["react", "nextjs", "tailwindcss"]
            },
            {
                id: 2,
                name: "ai-image-gen",
                full_name: "username/ai-image-gen",
                description: "Generate images using Stable Diffusion API.",
                html_url: "https://github.com/username/ai-image-gen",
                language: "Python",
                topics: ["ai", "machine-learning", "python"]
            }
        ];
        setRepos(mockRepos);
        setShowRepoModal(true);
    } catch (error) {
        console.error("Failed to fetch repos", error);
        alert("Failed to fetch GitHub repositories. Please ensure your account is connected.");
    } finally {
        setFetchingRepos(false);
    }
  };

  const handleRepoSelect = (repo: GitHubRepo) => {
      setForm(prev => ({
          ...prev,
          title: repo.name,
          description: repo.description || "",
          github: repo.html_url,
          techStack: [repo.language, ...(repo.topics || [])].filter(Boolean).join(", "),
          // Try to guess category based on topics/language
          category: repo.topics?.includes('ai') ? 'ai' : 
                   repo.topics?.includes('mobile') ? 'mobile' : 
                   repo.topics?.includes('game') ? 'game' : 
                   'web' 
      }));
      setShowRepoModal(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Convert to base64
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
    setLoading(true);
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
        image: form.image, // Include base64 image
        visibility: 'public', // Make projects public by default
      };
      
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create project');
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
    <form 
      className={`rounded-[24px] p-6 md:p-8 shadow-sm space-y-6 ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`} 
      onSubmit={handleSubmit}
    >
      
      <div className="flex justify-end">
          <button
            type="button"
            onClick={fetchGithubRepos}
            disabled={fetchingRepos}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDarkMode ? 'bg-[#222] hover:bg-[#333] text-white border border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-200'}`}
          >
            {fetchingRepos ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
            Import from GitHub
          </button>
      </div>

      {/* Project Title */}
      <div className="space-y-2">
        <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Project Title</label>
        <input 
          type="text" 
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter project title" 
          className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
        />
      </div>

      {/* Attach Photo */}
      <div className="space-y-2">
        <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Attach Image / Logo</label>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
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
          placeholder="Describe your project..." 
          className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium resize-none ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
        />
      </div>

      {/* Two Column Layout for Dropdowns */}
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
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

      {/* Create Group Option */}
      <div className="space-y-2">
        <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Project Communication</label>
        <div 
          className={`w-full p-4 rounded-xl border shadow-sm flex items-center justify-between opacity-80 cursor-not-allowed ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-50 border-[#E50914]'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-[#E50914] text-white">
              <FolderKanban size={20} />
            </div>
            <div className="text-left">
              <h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Group&apos;s Project will be created</h4>
              <p className="text-xs text-gray-500">User will be added to the project&apos;s chat group automatically once approved by you</p>
            </div>
          </div>
          
          <div className="w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button 
          type="button" 
          onClick={onCancel}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#222]' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className={`px-8 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-[#E50914]/20 transition-all hover:shadow-[#E50914]/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#F4A261] to-[#E50914]`}
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>

    {/* GitHub Repo Modal */}
    {showRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-[#1a1a1a] border border-gray-800' : 'bg-white'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>Select Repository</h3>
                    <button onClick={() => setShowRepoModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        ✕
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {repos.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No repositories found.</p>
                    ) : (
                        repos.map(repo => (
                            <button
                                key={repo.id}
                                onClick={() => handleRepoSelect(repo)}
                                className={`w-full text-left p-4 rounded-xl border transition-all hover:border-[#E50914] group ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold ${isDarkMode ? 'text-white group-hover:text-[#E50914]' : 'text-black group-hover:text-[#E50914]'}`}>{repo.name}</h4>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">{repo.language}</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{repo.description}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )}
    </>
  );
}
