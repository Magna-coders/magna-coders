'use client';

import React, { useState, useRef } from 'react';
import { 
  X, Search, Check, ChevronRight, Camera, Users, 
  ArrowLeft, Image as ImageIcon
} from 'lucide-react';

// --- TYPES ---

interface Friend {
  id: string;
  name: string;
  avatarColor: string; // Tailwind class
  initials: string;
  isOnline?: boolean;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, members: string[], avatar?: File) => void;
  existingFriends?: Friend[]; // In a real app, this would come from a prop or context
  isDarkMode?: boolean;
}

export default function CreateGroupModal({ 
  isOpen, 
  onClose, 
  onCreateGroup,
  existingFriends = [],
  isDarkMode = false
}: CreateGroupModalProps) {
  // Steps: 'select-members' -> 'group-details'
  const [step, setStep] = useState<'select-members' | 'group-details'>('select-members');
  
  // Selection State
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Details State
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- HANDLERS ---

  const handleToggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    if (selectedMembers.length > 0) {
      setStep('group-details');
    }
  };

  const handleBackStep = () => {
    setStep('select-members');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreate = () => {
    if (!groupName.trim()) return;
    onCreateGroup(groupName, selectedMembers, groupAvatar || undefined);
    
    // Reset and close
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep('select-members');
    setSelectedMembers([]);
    setSearchQuery('');
    setGroupName('');
    setGroupAvatar(null);
    setPreviewUrl(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // --- RENDERERS ---

  const filteredFriends = existingFriends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className={`md:rounded-3xl shadow-none md:shadow-2xl w-full md:max-w-md h-full md:h-auto md:max-h-[85vh] overflow-hidden relative flex flex-col animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between z-10 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-3">
            {step === 'group-details' && (
              <button 
                onClick={handleBackStep}
                className={`p-2 -ml-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
              {step === 'select-members' ? 'New Group' : 'Group Details'}
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: SELECT MEMBERS */}
        {step === 'select-members' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-400'}`} size={18} />
                <input 
                  type="text" 
                  placeholder="Search friends..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E50914] text-sm ${isDarkMode ? 'bg-black border border-[#F4A261]/30 text-[#F4A261] placeholder-[#F4A261]/50' : 'bg-gray-50 border border-gray-100 text-black'}`}
                />
              </div>
            </div>

            {/* Selected Pills */}
            {selectedMembers.length > 0 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                {selectedMembers.map(id => {
                  const friend = existingFriends.find(f => f.id === id);
                  if (!friend) return null;
                  return (
                    <div key={id} className={`flex items-center gap-1 pl-1 pr-2 py-1 rounded-full text-xs font-medium whitespace-nowrap animate-in zoom-in duration-200 ${isDarkMode ? 'bg-black text-[#F4A261] border border-[#F4A261]/40' : 'bg-black text-white'}`}>
                      <div className={`w-5 h-5 rounded-full ${friend.avatarColor} flex items-center justify-center text-[8px] font-bold`}>
                        {friend.initials}
                      </div>
                      <span>{friend.name.split(' ')[0]}</span>
                      <button 
                        onClick={() => handleToggleMember(id)}
                        className="ml-1 p-0.5 hover:bg-white/20 rounded-full"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Friends List */}
            <div className={`flex-1 overflow-y-auto p-2 ${isDarkMode ? 'bg-[#111]' : ''}`}>
              <div className="px-2 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Suggested</div>
              {filteredFriends.map(friend => {
                const isSelected = selectedMembers.includes(friend.id);
                return (
                  <div 
                    key={friend.id}
                    onClick={() => handleToggleMember(friend.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? isDarkMode ? 'bg-black border border-[#F4A261]' : 'bg-[#FDF8F5] border border-[#E50914]/10' 
                        : isDarkMode ? 'hover:bg-[#222] border border-transparent' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full ${friend.avatarColor} flex items-center justify-center font-bold text-sm`}>
                          {friend.initials}
                        </div>
                        {friend.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2ECC71] border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm ${isSelected ? isDarkMode ? 'font-bold text-[#F4A261]' : 'font-bold text-black' : isDarkMode ? 'font-medium text-gray-300' : 'font-medium text-gray-700'}`}>
                          {friend.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {friend.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? isDarkMode ? 'bg-[#F4A261] border-[#F4A261] text-black' : 'bg-[#E50914] border-[#E50914] text-white' 
                        : isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
              <button 
                onClick={handleNextStep}
                disabled={selectedMembers.length === 0}
                className="w-full py-3.5 bg-[#E50914] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#cc0812] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next Step
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GROUP DETAILS */}
        {step === 'group-details' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 flex flex-col items-center gap-6">
              
              {/* Avatar Upload */}
              <div className="relative group">
                <div 
                  className={`w-24 h-24 rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode ? 'bg-black border-[#F4A261]/30' : 'bg-gray-100 border-gray-300'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`flex flex-col items-center gap-1 ${isDarkMode ? 'text-[#F4A261]' : 'text-gray-400'}`}>
                      <Camera size={24} />
                      <span className="text-[10px] font-medium uppercase">Add Photo</span>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera size={24} />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Group Name Input */}
              <div className="w-full space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Group Name</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Project Alpha Team"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E50914]/20 focus:border-[#E50914] text-sm font-medium transition-all ${isDarkMode ? 'bg-black border-[#F4A261]/30 text-[#F4A261] placeholder-[#F4A261]/50' : 'bg-gray-50 border-gray-200'}`}
                  autoFocus
                />
              </div>

              {/* Members Summary */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-gray-500 uppercase">Members ({selectedMembers.length})</span>
                  <button onClick={handleBackStep} className="text-xs text-[#E50914] font-bold hover:underline">
                    Edit
                  </button>
                </div>
                <div className={`rounded-xl p-3 max-h-[150px] overflow-y-auto ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map(id => {
                      const friend = existingFriends.find(f => f.id === id);
                      if (!friend) return null;
                      return (
                        <div key={id} className={`flex items-center gap-1.5 px-2 py-1 border rounded-lg text-xs font-medium ${isDarkMode ? 'bg-black border-[#F4A261]/40 text-[#F4A261]' : 'bg-white border-gray-200 text-gray-700'}`}>
                          <div className={`w-4 h-4 rounded-full ${friend.avatarColor} flex items-center justify-center text-[8px] font-bold`}>
                            {friend.initials}
                          </div>
                          {friend.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className={`mt-auto p-4 border-t ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
              <button 
                onClick={handleCreate}
                disabled={!groupName.trim()}
                className="w-full py-3.5 bg-[#E50914] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#cc0812] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Create Group
                <Users size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
