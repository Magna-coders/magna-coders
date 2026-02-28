import React from 'react';

interface DeleteConfirmationModalProps {
  isVisible: boolean;
  isDarkMode: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  isVisible,
  isDarkMode,
  onCancel,
  onConfirm
}: DeleteConfirmationModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className={`rounded-2xl p-6 max-w-sm w-full shadow-xl ${isDarkMode ? 'bg-[#111] border border-[#333]' : 'bg-white'}`}>
        <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete Chat?</h3>
        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Are you sure you want to delete this chat? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-[#222]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-[#E50914] text-white hover:bg-[#b80710] rounded-lg font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
