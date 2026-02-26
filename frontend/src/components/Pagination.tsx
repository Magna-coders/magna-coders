import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isDarkMode?: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, isDarkMode = false }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 pb-12">
        <button 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`p-3 rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all ${isDarkMode ? 'border-[#333] hover:bg-[#222] text-gray-300 bg-[#111]' : 'border-gray-200 hover:bg-white hover:shadow-md bg-white/50'}`}
        >
            <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2 px-2 md:px-4 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
            {Array.from({ length: totalPages }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => onPageChange(i + 1)}
                    className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        currentPage === i + 1 
                            ? (isDarkMode ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/20 scale-110' : 'bg-[#E50914] text-white shadow-lg shadow-red-200 scale-110')
                            : (isDarkMode ? 'bg-[#111] border border-[#333] text-gray-400 hover:bg-[#222]' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')
                    }`}
                >
                    {i + 1}
                </button>
            ))}
        </div>

        <button 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`p-3 rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all ${isDarkMode ? 'border-[#333] hover:bg-[#222] text-gray-300 bg-[#111]' : 'border-gray-200 hover:bg-white hover:shadow-md bg-white/50'}`}
        >
            <ChevronRight size={20} />
        </button>
    </div>
  );
}
