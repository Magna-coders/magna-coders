import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function ThemeToggle({ isDarkMode, toggleTheme }: ThemeToggleProps) {
  return (
    <button 
      onClick={toggleTheme}
      className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#E50914] ${isDarkMode ? 'bg-gray-800' : 'bg-[#FBE6A4] border border-[#F4A261]/30'}`}
    >
      <div className="absolute inset-0 flex justify-between items-center px-2">
        <Sun className="w-4 h-4 text-[#E50914]" />
        <Moon className="w-4 h-4 text-[#F4A261]" />
      </div>
      <motion.div 
        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md"
        animate={{ x: isDarkMode ? 32 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
