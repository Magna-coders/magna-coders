import React, { useRef } from 'react';
import Image from 'next/image';
import { X, Image as ImageIcon } from 'lucide-react';

interface PostEditorProps {
  content: string;
  setContent: (content: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  selectedGistId?: string | null;
  setSelectedGistId?: (gistId: string | null) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDarkMode: boolean;
}

export default function PostEditor({
  content,
  setContent,
  selectedImage,
  setSelectedImage,
  selectedGistId,
  setSelectedGistId,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  isDarkMode
}: PostEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div 
      className={`flex-1 p-4 md:p-6 flex flex-col transition-colors ${isDragOver ? 'bg-[#E50914]/5' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <textarea
        ref={textareaRef}
        placeholder="What do you want to talk about?"
        className={`w-full flex-1 resize-none text-xl focus:outline-none min-h-[150px] bg-transparent leading-relaxed ${isDarkMode ? 'text-[#F9E4AD] placeholder-gray-600' : 'text-[#444444] placeholder-gray-400'}`}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          adjustTextareaHeight();
        }}
      />

      {/* Gist Preview */}
      {selectedGistId && (
        <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className={`p-3 text-xs font-mono flex justify-between items-center ${isDarkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
            <span>gist.github.com/{selectedGistId}</span>
            <button 
              onClick={() => setSelectedGistId && setSelectedGistId(null)}
              className="hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
          {/* We can't easily embed the script tag directly in React without danger/complexity, 
              so we'll show a static preview or iframe. For now, a placeholder card. */}
          <div className={`p-4 flex flex-col items-center justify-center gap-2 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
             <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
               <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={isDarkMode ? 'text-white' : 'text-black'}>
                 <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
               </svg>
             </div>
             <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>GitHub Gist Attached</p>
             <p className="text-xs text-gray-500">ID: {selectedGistId}</p>
          </div>
        </div>
      )}

      {/* Image/Video Preview */}
      {selectedImage && (
        <div className="relative mt-4 rounded-xl overflow-hidden group">
          {selectedImage.startsWith('data:video/') ? (
            // Video preview
            <video 
              src={selectedImage} 
              controls 
              className="w-full h-auto max-h-[500px] rounded-xl border border-gray-100"
              onError={(e) => console.error('Video preview error:', e)}
            />
          ) : (
            // Image preview - use regular img tag for base64
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[500px] object-cover rounded-xl border border-gray-100"
              onError={(e) => {
                console.error('Image preview error:', e);
                console.log('Preview image length:', selectedImage.length);
              }}
            />
          )}
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all backdrop-blur-sm"
          >
            <X size={18} />
          </button>
        </div>
      )}
      
      {/* Drag & Drop Hint */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm border-2 border-dashed border-[#E50914] rounded-3xl m-4 z-10 pointer-events-none">
          <div className="text-center">
            <ImageIcon size={48} className="mx-auto text-[#E50914] mb-2" />
            <p className="text-[#E50914] font-bold">Drop image here</p>
          </div>
        </div>
      )}
    </div>
  );
}
