'use client';

import React, { useState } from 'react';
import { 
  X, Search, Users, Coins, ArrowRight, CheckCircle, Info
} from 'lucide-react';
import GroupDetailsModal from './GroupDetailsModal';

// --- TYPES ---

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  avatarColor: string; // Tailwind class
  accessType: 'request' | 'paid';
  cost?: number; // In Magna Coin
  isJoined?: boolean;
  // Extended info for detail modal
  dateCreated: string;
  messagesPerDay: number;
  activeMembers: number;
  adminName: string;
}

interface DiscoverGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGroup: (groupId: string, type: 'request' | 'paid', cost?: number) => void;
  isDarkMode?: boolean;
}


export default function DiscoverGroupsModal({ 
  isOpen, 
  onClose, 
  onJoinGroup,
  isDarkMode = false
}: DiscoverGroupsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  if (!isOpen) return null;

  // --- HANDLERS ---
  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleJoinFromDetails = () => {
    if (selectedGroup) {
      onJoinGroup(selectedGroup.id, selectedGroup.accessType, selectedGroup.cost);
      setSelectedGroup(null); // Close details modal
      // We keep the main modal open or close it based on parent logic, 
      // but usually we might want to close everything if join is successful.
      // For now let's assume parent handles main modal close if needed.
    }
  };

  // --- RENDERERS ---

  const filteredGroups: Group[] = []; // No mock data - groups should come from API

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />

        {/* Modal Content */}
      <div className={`md:rounded-3xl shadow-none md:shadow-2xl w-full md:max-w-md h-full md:h-auto md:max-h-[85vh] overflow-hidden relative flex flex-col animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        
        {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between z-10 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <h2 className={`font-bold text-lg ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Discover Groups</h2>
            </div>
            <button 
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search groups..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E50914] text-sm ${isDarkMode ? 'bg-[#222] border border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border border-gray-100 text-black'}`}
                />
              </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Users size={48} className="mb-2 opacity-20" />
                  <p>No groups found</p>
                </div>
              ) : (
                filteredGroups.map(group => (
                  <div 
                    key={group.id}
                    onClick={() => handleGroupClick(group)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${isDarkMode ? 'bg-[#1a1a1a] border-gray-800 hover:border-[#E50914]/40 hover:bg-[#222]' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${group.avatarColor} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                        {group.name.substring(0, 2).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`font-bold truncate pr-2 group-hover:text-[#E50914] transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>{group.name}</h3>
                          <span className="text-xs text-gray-400 font-medium whitespace-nowrap flex items-center gap-1">
                            <Users size={12} />
                            {group.memberCount.toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-2 mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{group.description}</p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[10px] text-gray-400 px-2 py-1 rounded-md border flex items-center gap-1 ${isDarkMode ? 'bg-[#222] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                             <Info size={10} />
                             Tap for details
                          </span>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onJoinGroup(group.id, group.accessType, group.cost);
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              group.accessType === 'paid' 
                                ? 'bg-[#F4A261]/10 text-[#F4A261] hover:bg-[#F4A261]/20' 
                                : 'bg-black text-white hover:bg-gray-800'
                            }`}
                          >
                            {group.accessType === 'paid' ? (
                              <>
                                <span>{group.cost}</span>
                                <Coins size={14} />
                              </>
                            ) : (
                              <>
                                <span>Join</span>
                                <ArrowRight size={14} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedGroup && (
        <GroupDetailsModal
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          group={selectedGroup}
          onJoin={handleJoinFromDetails}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
}
