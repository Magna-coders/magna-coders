import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  onFileSelect?: (file: File) => void;
  isDarkMode: boolean;
}

export default function FileUpload({ label, accept = "image/*", onFileSelect, isDarkMode }: FileUploadProps) {
  return (
    <div className="space-y-2">
      <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      <div className={`w-full px-4 py-8 rounded-xl border border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer group ${isDarkMode ? 'bg-[#222] border-gray-700 hover:border-[#E50914]' : 'bg-gray-50 border-gray-300 hover:border-[#E50914]'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-[#333]' : 'bg-white'}`}>
          <Upload size={20} className="text-gray-400 group-hover:text-[#E50914]" />
        </div>
        <span className="text-sm font-medium text-gray-600 group-hover:text-[#E50914]">Click to upload image</span>
        <span className="text-xs text-gray-400 mt-1">SVG, PNG, JPG (max. 2MB)</span>
        <input 
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileSelect?.(e.target.files[0]);
            }
          }}
        />
      </div>
    </div>
  );
}
