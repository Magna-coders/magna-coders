"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Helper for authenticated requests
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
  }
  return null;
};

const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  if (!API_BASE) throw new Error('API URL is not defined');
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
};

interface JobFormProps {
  isDarkMode: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  jobId?: string | number;
}

export default function JobForm({ isDarkMode, onCancel, onSuccess, jobId }: JobFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    title: '',
    company: '',
    description: '',
    location: '',
    jobType: '',
    salary: '',
    tags: '',
    image: null as File | null
  });
  const [loading, setLoading] = React.useState(false);
  const [loadingJob, setLoadingJob] = React.useState(false);
  const [jobError, setJobError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function loadJob() {
      if (!jobId) return;
      setLoadingJob(true);
      try {
        const data = await authenticatedFetch(`/jobs/${encodeURIComponent(String(jobId))}`);
        if (!mounted) return;
        setForm(prev => ({
          ...prev,
          title: data.title || '',
          company: data.company || '',
          description: data.description || '',
          location: data.location || '',
          jobType: data.jobType || data.employment_type || '',
          salary: data.salary || data.salary_text || '',
          tags: (data.skills || data.tags || []).join(', ')
        }));
      } catch (err: any) {
        if (!mounted) return;
        setJobError(err?.message || 'Failed to load job');
      } finally {
        if (mounted) setLoadingJob(false);
      }
    }
    loadJob();
    return () => { mounted = false; };
  }, [jobId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleFile = (file: File) => {
    setForm(prev => ({ ...prev, image: file }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        title: form.title,
        company: form.company,
        description: form.description,
        location: form.location,
        jobType: form.jobType,
        salary: form.salary,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (jobId) {
        await authenticatedFetch(`/jobs/${encodeURIComponent(String(jobId))}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await authenticatedFetch('/jobs', { method: 'POST', body: JSON.stringify(body) });
      }
      if (onSuccess) onSuccess();
      // Redirect back to jobs list after successful create/update
      router.push('/jobs');
    } catch (err) {
      alert('Failed to create job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl md:rounded-[24px] p-5 md:p-8 shadow-sm space-y-6 ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
      {loadingJob && <div className="text-center py-4">Loading job...</div>}
      {jobError && <div className="text-center text-red-500 py-4">{jobError}</div>}
      
      {/* Job Title */}
      <div className="space-y-2">
        <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Title</label>
        <input 
          type="text" 
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Senior Frontend Developer" 
          className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
        />
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Company Name</label>
        <input 
          type="text" 
          name="company"
          value={form.company}
          onChange={handleChange}
          placeholder="e.g. Magna Coders" 
          className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Description</label>
        <textarea 
          rows={6} 
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the role, responsibilities, and requirements..." 
          className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium resize-none ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
        />
      </div>

      {/* Two Column Layout for Location and Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location */}
        <div className="space-y-2">
          <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
          <input 
            type="text" 
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Nairobi, Kenya (Remote)" 
            className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
          />
        </div>

        {/* Job Type */}
        <div className="space-y-2">
          <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Type</label>
          <div className="relative">
            <select name="jobType" value={form.jobType} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium appearance-none cursor-pointer ${isDarkMode ? 'bg-[#222] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}>
              <option value="">Select Type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Range */}
      <div className="space-y-2">
        <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Salary Range</label>
        <input 
          type="text" 
          name="salary"
          value={form.salary}
          onChange={handleChange}
          placeholder="e.g. Ksh 150,000 – 250,000" 
          className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
        />
      </div>

      {/* Skills/Tags */}
      <div className="space-y-2">
        <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Skills Required (comma separated)</label>
        <input 
          type="text" 
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="e.g. React, TypeScript, Tailwind CSS, Next.js" 
          className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm font-medium ${isDarkMode ? 'bg-[#222] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-black placeholder:text-gray-400'}`}
        />
      </div>

      {/* Attach Photo */}
      {/* <FileUpload 
        label="Attach Image / Logo" 
        isDarkMode={isDarkMode} 
        onFileSelect={handleFile}
      /> */}

      {/* Actions */}
      <div className="pt-4 flex flex-col-reverse md:flex-row gap-4">
         <button 
          type="button"
          onClick={onCancel} 
          className={`flex-1 py-3.5 border rounded-xl font-bold text-sm transition-colors text-center ${isDarkMode ? 'bg-[#222] border-gray-700 text-gray-300 hover:bg-[#333]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-[#E50914] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#cc0812] transition-all active:scale-95 disabled:opacity-60">
          {loading ? (jobId ? 'Updating...' : 'Posting...') : (jobId ? 'Update Opportunity' : 'Post Opportunity')}
        </button>
      </div>

    </form>
  );
}
