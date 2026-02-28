"use client";

import React, { useState, useEffect } from 'react';
import { MoreHorizontal, MapPin, Briefcase, DollarSign, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { applyToJob, bookmarkJob, getBookmarkState } from '@/services/jobs';

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  postedAt: string;
  description: string;
  tags: string[];
  logoColor: string;
  category: string;
  isExpired?: boolean;
  timeLeft?: string;
  isOwner?: boolean;
  opportunityId?: string | number;
  hasApplied?: boolean;
  isBookmarked?: boolean;
}

interface JobCardProps {
  job: Job;
  isDarkMode: boolean;
  showExpiration?: boolean;
  isCompact?: boolean;
  onJobUpdate?: () => void;
}

export default function JobCard({ job, isDarkMode, showExpiration = false, isCompact = false, onJobUpdate }: JobCardProps) {
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(job.hasApplied || false);
  const [isBookmarked, setIsBookmarked] = useState(job.isBookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    // Check bookmark state on mount
    if (job.opportunityId) {
      checkBookmarkState();
    }
  }, [job.opportunityId]);

  const checkBookmarkState = async () => {
    try {
      const response = await getBookmarkState(String(job.opportunityId));
      setIsBookmarked(response.bookmarked || false);
    } catch (error) {
      // Silently fail - bookmark state is not critical
    }
  };

  const handleApply = async () => {
    if (applying || hasApplied || !job.opportunityId) return;
    
    setApplying(true);
    try {
      await applyToJob(String(job.opportunityId), {
        coverLetter: 'I am interested in this position.'
      });
      setHasApplied(true);
      alert('Application submitted successfully! The employer has been notified.');
      if (onJobUpdate) onJobUpdate();
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to apply';
      if (errorMsg.includes('already applied')) {
        setHasApplied(true);
        alert('You have already applied to this job.');
      } else {
        alert(errorMsg);
      }
    } finally {
      setApplying(false);
    }
  };

  const handleBookmark = async () => {
    if (bookmarking || !job.opportunityId) return;
    
    setBookmarking(true);
    try {
      const response = await bookmarkJob(String(job.opportunityId));
      // Toggle based on response
      setIsBookmarked(response.bookmarked || false);
      if (onJobUpdate) onJobUpdate();
    } catch (error: any) {
      alert(error?.message || 'Failed to update bookmark');
    } finally {
      setBookmarking(false);
    }
  };

  if (isCompact) {
    return (
      <div className={`rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all group h-full flex flex-col ${
        isDarkMode 
          ? 'bg-[#111] border-[#E70008]/20' 
          : 'bg-white border-gray-100'
      }`}>
        <div className={`h-16 relative overflow-hidden ${job.logoColor} flex items-center justify-center`}>
          <div className="text-white font-bold text-xl">{job.company.charAt(0)}</div>
        </div>
        
        <div className="p-2 flex-1 flex flex-col min-w-0">
          <div className="mb-1">
             <h3 className={`font-bold text-[10px] leading-tight group-hover:text-[#E50914] transition-colors truncate ${
               isDarkMode ? 'text-white' : 'text-black'
             }`}>
               {job.title}
             </h3>
             <p className="text-[9px] text-gray-500 truncate">{job.company}</p>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-auto">
             <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 truncate max-w-full">
               {job.location}
             </span>
             <span className="text-[8px] px-1.5 py-0.5 bg-[#E50914]/5 text-[#E50914] rounded font-medium">
               {job.salary.split(' - ')[0]}
             </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all group ${
      isDarkMode 
        ? 'bg-[#111] border-[#E70008]/30 shadow-[0_0_15px_rgba(231,0,8,0.1)]' 
        : 'bg-white border-gray-100'
    }`}>
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0 ${job.logoColor}`}>
            {job.company.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className={`text-lg font-bold transition-colors group-hover:text-[#E50914] truncate ${
              isDarkMode ? 'text-[#F9E4AD]' : 'text-black'
            }`}>
              {job.title}
            </h2>
            <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {job.company}
            </p>
          </div>
        </div>
        <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Description */}
      <p className={`text-sm mb-6 leading-relaxed line-clamp-2 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {job.description}
      </p>

      {/* Expiration Status for Saved Jobs */}
      {showExpiration && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${job.isExpired ? 'text-red-500' : 'text-gray-500'}`}>
              {job.isExpired ? 'Application Expired' : 'Application Deadline'}
            </span>
            <span className={`text-xs font-bold ${job.isExpired ? 'text-red-500' : 'text-[#E50914]'}`}>
              {job.timeLeft}
            </span>
          </div>
          {!job.isExpired && (
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#F4A261] to-[#E50914]"
                style={{ width: '65%' }} // Mock progress
              />
            </div>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 mb-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <div className="flex items-center gap-2">
          <MapPin size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-[#E50914]' : 'text-gray-400'}`} />
          <span className="truncate">{job.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-[#E50914]' : 'text-gray-400'}`} />
          <span>{job.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-[#E50914]' : 'text-gray-400'}`} />
          <span>{job.salary}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-[#E50914]' : 'text-gray-400'}`} />
          <span>{job.postedAt}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {job.tags.map(tag => (
          <span key={tag} className={`px-3 py-1 rounded-full text-xs font-medium border ${
            isDarkMode 
              ? 'bg-[#222] text-gray-300 border-gray-800' 
              : 'bg-gray-50 text-gray-600 border-gray-100'
          }`}>
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {job.isOwner ? (
          <a href={`/create-job?editId=${job.opportunityId || job.id}`} className="flex-1 py-2.5 bg-white border border-gray-200 text-black rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-colors flex items-center justify-center">
            Edit Job
          </a>
        ) : (
          <button 
            onClick={handleApply}
            disabled={applying || hasApplied}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors ${
              hasApplied
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-[#E50914] text-white hover:bg-[#cc0812]'
            }`}
          >
            {applying ? 'Applying...' : hasApplied ? 'Applied ✓' : 'Apply Now'}
          </button>
        )}

        <button 
          onClick={handleBookmark}
          disabled={bookmarking}
          className={`flex-1 py-2.5 border rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
            isDarkMode 
              ? `bg-transparent ${isBookmarked ? 'border-[#E70008] text-[#E70008]' : 'border-[#E70008]/40 text-[#F9E4AD]'} hover:bg-[#E70008]/10` 
              : `bg-white ${isBookmarked ? 'border-[#E50914] text-[#E50914]' : 'border-gray-200 text-black'} hover:bg-gray-50`
          }`}
        >
          {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {bookmarking ? 'Saving...' : isBookmarked ? 'Saved' : 'Save Job'}
        </button>
      </div>
    </div>
  );
}
