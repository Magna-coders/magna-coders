'use client';

import React from 'react';
import { TriangleAlert, X } from 'lucide-react';

interface InactiveAccountAlertProps {
  show: boolean;
  onClose: () => void;
  onResendEmail: () => void;
  isResending: boolean;
  isDarkMode: boolean;
}

export default function InactiveAccountAlert({ show, onClose, onResendEmail, isResending, isDarkMode }: InactiveAccountAlertProps) {
  if (!show) return null;

  return (
    <div className="w-full bg-[#E50914]/10 border border-[#E50914]/20 p-4 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#E50914]/20 flex items-center justify-center text-[#E50914]">
          <TriangleAlert size={16} />
        </div>
        <div>
          <h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Account Inactive</h4>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Please activate your account via the email link we sent you.</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onResendEmail}
          disabled={isResending}
          className={`text-xs font-bold text-[#E50914] hover:underline ${isResending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isResending ? 'Sending...' : 'Resend Email'}
        </button>
        <button onClick={onClose} className={`text-xs ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
