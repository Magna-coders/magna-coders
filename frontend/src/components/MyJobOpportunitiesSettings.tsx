import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Edit, Trash2, ArrowRight } from 'lucide-react';

export default function MyJobOpportunitiesSettings({ isDarkMode }: { isDarkMode?: boolean }) {
  // Mock data for jobs
  const myJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      type: "Full-time",
      location: "Remote",
      salary: "$120k - $150k",
      applicants: 12,
      status: "Active"
    },
    {
      id: 2,
      title: "UI/UX Designer",
      type: "Contract",
      location: "Nairobi, Kenya",
      salary: "$40/hr",
      applicants: 5,
      status: "Active"
    }
  ];

  return (
    <div className={`rounded-[24px] p-6 md:p-8 shadow-sm ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>My Job Opportunities</h2>
        <button className="px-4 py-2 bg-[#E50914] text-white text-sm font-bold rounded-full hover:bg-[#cc0812] transition-colors shadow-md">
          Post New Job
        </button>
      </div>
      
      <div className="space-y-4 mb-6">
        {myJobs.map((job) => (
          <div key={job.id} className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>{job.title}</h3>
                <div className="flex flex-wrap gap-3 mt-2 text-sm">
                  <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Briefcase size={14} /> {job.type}
                  </span>
                  <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <MapPin size={14} /> {job.location}
                  </span>
                  <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <DollarSign size={14} /> {job.salary}
                  </span>
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
            <div className={`mt-4 pt-4 border-t flex justify-between items-center text-xs ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                <strong>{job.applicants}</strong> applicants
              </span>
              <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                {job.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Link 
        href="/jobs" 
        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
          isDarkMode 
            ? 'bg-[#222] text-white hover:bg-[#333] border border-gray-700' 
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        View All Jobs
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
