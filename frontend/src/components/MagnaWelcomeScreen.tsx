'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users, Bug } from 'lucide-react';
import MagnaAiGreeting from '@/components/MagnaAiGreeting';
import MagnaChatInput from './MagnaChatInput';
import { useAuth } from '@/contexts/AuthContext';

interface MagnaWelcomeScreenProps {
  userName?: string;
  isDarkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSendMessage: () => void;
  handleServiceClick: (service: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export default function MagnaWelcomeScreen({
  userName = 'John',
  isDarkMode,
  searchQuery,
  setSearchQuery,
  handleSendMessage,
  handleServiceClick,
  inputRef
}: MagnaWelcomeScreenProps) {
  const { token } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 pt-20 md:pt-24 pb-40 md:pb-8 flex flex-col items-start justify-start w-full max-w-4xl mx-auto gap-8">
      {/* Greeting with real user context */}
      <MagnaAiGreeting isDarkMode={isDarkMode} authToken={token || undefined} />

      {/* Desktop Input Area */}
      <div className="hidden md:block w-full">
         <MagnaChatInput 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSendMessage={handleSendMessage}
            isDarkMode={isDarkMode}
            inputRef={inputRef}
         />
      </div>

      {/* Services Section */}
      <div className="w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-start gap-3 md:gap-4">
            {/* Job Opportunities */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleServiceClick('Job Opportunities')}
              className={`flex items-center gap-3 px-5 py-2 rounded-full transition-colors w-fit md:w-auto min-h-[48px] shadow-sm bg-[#E50914] hover:bg-[#cc0812]`}
            >
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'rounded-full bg-black text-[#F4A261]' : 'text-black'}`}>
                <Briefcase size={18} />
              </div>
              <span className={`font-medium text-sm text-black`}>Job Opportunities</span>
            </motion.button>

            {/* Search Builders & Collabs */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleServiceClick('Search Builders & Collabs')}
              className={`flex items-center gap-3 px-5 py-2 rounded-full transition-colors w-fit md:w-auto min-h-[48px] shadow-sm bg-[#E50914] hover:bg-[#cc0812]`}
            >
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'rounded-full bg-black text-[#F4A261]' : 'text-black'}`}>
                <Users size={18} />
              </div>
              <span className={`font-medium text-sm text-black`}>Search Builders & Collabs</span>
            </motion.button>

            {/* Debug Code */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleServiceClick('Debug Code')}
              className={`flex items-center gap-3 px-5 py-2 rounded-full transition-colors w-fit md:w-auto min-h-[48px] shadow-sm bg-[#E50914] hover:bg-[#cc0812]`}
            >
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'rounded-full bg-black text-[#F4A261]' : 'text-black'}`}>
                <Bug size={18} />
              </div>
              <span className={`font-medium text-sm text-black`}>Debug Code</span>
            </motion.button>
          </div>
      </div>
    </div>
  );
}
