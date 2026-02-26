import React from 'react';
import { MessageSquare, Mail, ChevronRight } from 'lucide-react';
import { faqsData } from '@/app/settings/data';

export default function HelpCenterSettings({ isDarkMode }: { isDarkMode?: boolean }) {
  return (
    <div className={`lg:rounded-[24px] lg:p-8 lg:shadow-sm ${isDarkMode ? 'lg:bg-[#111] lg:border lg:border-[#E70008]/20' : 'lg:bg-white'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Help Center</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className={`p-6 rounded-xl border transition-all cursor-pointer text-center ${isDarkMode ? 'border-gray-700 hover:border-[#F4A261]' : 'border-gray-100 hover:border-[#F4A261]'}`}>
          <MessageSquare className="w-8 h-8 text-[#F4A261] mx-auto mb-3" />
          <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Chat Support</h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Talk to our team live</p>
        </div>
        <div className={`p-6 rounded-xl border transition-all cursor-pointer text-center ${isDarkMode ? 'border-gray-700 hover:border-[#F4A261]' : 'border-gray-100 hover:border-[#F4A261]'}`}>
          <Mail className="w-8 h-8 text-[#E50914] mx-auto mb-3" />
          <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Email Us</h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get a response in 24h</p>
        </div>
      </div>

      <h3 className={`text-sm font-bold uppercase mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Frequently Asked Questions</h3>
      <div className="space-y-3">
        {faqsData.map((q, i) => (
          <div key={i} className={`p-4 rounded-xl flex justify-between items-center cursor-pointer transition-colors ${isDarkMode ? 'bg-[#222] hover:bg-[#333]' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{q}</span>
            <ChevronRight size={16} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
          </div>
        ))}
      </div>
    </div>
  );
}
