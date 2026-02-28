import React from 'react';
import { ArrowRight } from 'lucide-react';

interface PurchaseButtonProps {
  disabled: boolean;
  isDarkMode: boolean; // Kept for consistency if we want to support theme-specific styles, though the button styles look consistent.
  onClick?: () => void;
}

export default function PurchaseButton({ disabled, onClick }: PurchaseButtonProps) {
  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
        disabled
          ? 'bg-gray-300 cursor-not-allowed text-gray-500'
          : 'bg-[#E50914] text-white hover:bg-[#cc0812] active:scale-95'
      }`}
    >
      Complete Purchase <ArrowRight size={20} />
    </button>
  );
}
