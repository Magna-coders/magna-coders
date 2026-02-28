"use client";

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import { getFriends, Friend } from '@/services/friends';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (userId: string) => Promise<void>;
  isDarkMode: boolean;
  ownerId?: string; // Add ownerId to filter out the owner
}

export default function AddMemberModal({ isOpen, onClose, onAddMember, isDarkMode, ownerId }: AddMemberModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const friendsList = await getFriends();
      // Filter out the owner from the friends list
      const filteredFriends = ownerId 
        ? friendsList.filter(friend => friend.id !== ownerId)
        : friendsList;
      setFriends(filteredFriends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAddingMemberId(userId);
    try {
      await onAddMember(userId);
      onClose();
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setAddingMemberId(null);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 max-w-md w-full max-h-[80vh] flex flex-col ${
        isDarkMode ? 'bg-[#111] border border-[#E70008]/30' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>
            Add Team Member
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-[#222]' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
              isDarkMode 
                ? 'bg-[#222] border-gray-700 text-white placeholder-gray-500' 
                : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400'
            }`}
          />
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E50914]"></div>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {searchQuery ? 'No friends found matching your search' : 'No friends yet. Add friends to invite them to your project.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isDarkMode 
                      ? 'bg-[#0a0a0a] border-gray-800 hover:bg-[#1a1a1a]' 
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {friend.avatar_url ? (
                      <img 
                        src={friend.avatar_url} 
                        alt={friend.username} 
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {friend.username}
                      </h4>
                      {friend.bio && (
                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(friend.id)}
                    disabled={addingMemberId === friend.id}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E50914] text-white rounded-lg font-bold text-sm hover:bg-[#cc0812] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {addingMemberId === friend.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Add
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-xl font-bold transition-colors ${
              isDarkMode ? 'bg-[#222] text-white hover:bg-[#333]' : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
