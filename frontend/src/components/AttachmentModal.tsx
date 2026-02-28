'use client';

import React from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'document' | 'media') => void;
}

export default function AttachmentModal({ 
  isOpen, 
  onClose, 
  onSelectType 
}: AttachmentModalProps) {
  if (!isOpen) return null;

  const options = [
    { 
      id: 'document' as const, 
      label: 'Documents', 
      icon: FileText, 
      color: 'bg-blue-100 text-blue-600',
      description: 'Send PDF, Word, etc.'
    },
    { 
      id: 'media' as const, 
      label: 'Photos & Videos', 
      icon: ImageIcon, 
      color: 'bg-pink-100 text-pink-600',
      description: 'Share images or videos'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-md overflow-hidden relative flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <h2 className="font-bold text-lg text-black">Share Content</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-6 grid grid-cols-3 gap-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectType(option.id)}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
            >
              <div className={`w-14 h-14 rounded-2xl ${option.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <option.icon size={28} strokeWidth={2} />
              </div>
              <div className="text-center">
                <span className="block text-xs font-bold text-gray-800 mb-0.5">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Cancel Button (Mobile only mainly) */}
        <div className="p-4 border-t border-gray-100 md:hidden">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
