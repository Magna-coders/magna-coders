import React, { useState } from 'react';
import { Briefcase, MapPin, DollarSign, Users, FileText, X } from 'lucide-react';
import type { JobPost } from '@/types';

interface JobPostDetailsProps {
  post: JobPost;
  isApplied: boolean;
  onApply: () => void;
}

interface Application {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  resumeUrl: string;
  coverLetter: string;
  status: string;
  appliedAt: string;
}

export default function JobPostDetails({ post, isApplied, onApply }: JobPostDetailsProps) {
  const [showApplications, setShowApplications] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [errorApps, setErrorApps] = useState('');

  const handleViewApplications = async () => {
    if (showApplications) {
      setShowApplications(false);
      return;
    }

    setShowApplications(true);
    setLoadingApps(true);
    setErrorApps('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/applications/${post.id}/applications`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
             setApplications([]); // No applications found or endpoint not ready
             return;
        }
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setErrorApps(err.message || 'Failed to load applications');
    } finally {
      setLoadingApps(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border border-[#2ECC71]/30 rounded-2xl p-6 bg-[#2ECC71]/5">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-[#F4A261] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Briefcase size={32} />
          </div>
          <div>
            <h2 className="font-bold text-2xl text-black leading-tight">{post.title}</h2>
            <p className="text-gray-600 font-medium text-lg">{post.company}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Location</div>
            <div className="font-bold text-black flex items-center gap-2">
              <MapPin size={16} className="text-[#E50914]" />
              {post.location}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Salary</div>
            <div className="font-bold text-black flex items-center gap-2">
              <DollarSign size={16} className="text-[#2ECC71]" />
              {post.salary}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Type</div>
            <div className="font-bold text-black flex items-center gap-2">
              <Briefcase size={16} className="text-[#F4A261]" />
              {post.jobType}
            </div>
          </div>
        </div>

        <h3 className="font-bold text-xl text-black mb-4">Job Description</h3>
        <p className="text-gray-600 leading-relaxed mb-8 text-lg">
          {post.description}
          <br/><br/>
          We are looking for a passionate individual to join our growing team. You will be working on cutting-edge technologies and solving complex problems.
        </p>

        <h3 className="font-bold text-xl text-black mb-4">Requirements</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-8 text-lg">
          <li>3+ years of experience in frontend development</li>
          <li>Strong knowledge of React and TypeScript</li>
          <li>Experience with Next.js and Tailwind CSS</li>
          <li>Good communication skills</li>
        </ul>

        <div className="flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span key={tag} className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <button 
        onClick={onApply}
        disabled={isApplied}
        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform ${
          isApplied 
            ? 'bg-gray-400 cursor-default' 
            : 'bg-[#E50914] hover:bg-[#cc0812] hover:-translate-y-1'
        }`}
      >
        {isApplied ? 'Applied' : 'Apply for this Position'}
      </button>

      <button 
        onClick={handleViewApplications}
        className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-lg hover:bg-gray-50 transition-all"
      >
        {showApplications ? 'Hide Applications' : 'View Applications (For Job Poster)'}
      </button>

      {showApplications && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-xl text-black mb-4 flex items-center gap-2">
            <Users size={24} className="text-[#E50914]" />
            Applications ({applications.length})
          </h3>

          {loadingApps ? (
             <div className="flex justify-center py-8">
               <div className="w-8 h-8 border-4 border-gray-200 border-t-[#E50914] rounded-full animate-spin"></div>
             </div>
          ) : errorApps ? (
             <div className="text-red-500 text-center py-4 bg-red-50 rounded-lg">
               {errorApps}
             </div>
          ) : applications.length === 0 ? (
             <div className="text-gray-500 text-center py-8">
               No applications yet.
             </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                         {app.user?.name?.charAt(0) || '?'}
                       </div>
                       <div>
                         <div className="font-bold text-black">{app.user?.name || 'Unknown User'}</div>
                         <div className="text-sm text-gray-500">{app.user?.email}</div>
                       </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      {app.status || 'Applied'}
                    </span>
                  </div>
                  
                  {app.coverLetter && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                      <div className="font-semibold mb-1 text-gray-700">Cover Letter:</div>
                      {app.coverLetter}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    {app.resumeUrl && (
                      <a 
                        href={app.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#E50914] hover:underline font-medium"
                      >
                        <FileText size={16} />
                        View Resume
                      </a>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400 text-right">
                    Applied on {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Unknown Date'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
