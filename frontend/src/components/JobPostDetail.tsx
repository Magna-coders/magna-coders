import React from 'react';
import { Briefcase, MapPin, DollarSign } from 'lucide-react';
import type { JobPost } from '@/types';

interface JobPostDetailProps {
  post: JobPost;
  isApplied: boolean;
  onApply: () => void;
}

export default function JobPostDetail({ post, isApplied, onApply }: JobPostDetailProps) {
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
    </div>
  );
}
