import React, { useState, useRef, useEffect } from 'react';
import { Edit, MoreVertical, Users, MessageSquare, Plus, CheckSquare, Archive, Trash2, Download } from 'lucide-react';

interface ChatSidebarProps {
  isDarkMode: boolean;
  filter: 'chats' | 'groups' | 'unread' | 'archived';
  setFilter: (filter: 'chats' | 'groups' | 'unread' | 'archived') => void;
  onOpenDiscoverGroups: () => void;
  onCreateChat?: () => void;
  onCreateGroup?: () => void;
  children: React.ReactNode;
}

export default function ChatSidebar({ 
  isDarkMode, 
  filter, 
  setFilter, 
  onOpenDiscoverGroups, 
  onCreateChat,
  onCreateGroup,
  children 
}: ChatSidebarProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBulkAction = (action: string) => {
    // This would be connected to parent state in a real implementation
    console.log(`Performing bulk action: ${action}`);
    setShowMoreMenu(false);
    
    if (action === 'select') {
      setIsSelectionMode(!isSelectionMode);
      // Notify parent to enable selection mode
    } else {
       alert(`${action} functionality coming soon!`);
    }
  };

  return (
    <div className={`w-full md:w-[320px] lg:w-[380px] border-r flex flex-col h-full ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
      {/* Header */}
      <div className="p-4 md:p-6 pb-2">
        <div className="flex md:flex items-center justify-between mb-4">
            <h2 className={`font-bold text-xl md:block hidden ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Chats</h2>
            <h2 className={`font-bold text-xl md:hidden ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Messages</h2>
            <div className="flex gap-2">
              
              {/* Create Menu */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className={`p-2 rounded-full transition-colors hidden md:block ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <Edit size={20} />
                </button>
                
                {showCreateMenu && (
                  <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-lg border z-50 overflow-hidden animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-100'}`}>
                    <button 
                      onClick={() => {
                        if (onCreateChat) onCreateChat();
                        setShowCreateMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <MessageSquare size={16} className={isDarkMode ? 'text-[#E50914]' : 'text-[#E50914]'} />
                      New Chat
                    </button>
                    <button 
                      onClick={() => {
                        if (onCreateGroup) onCreateGroup();
                        setShowCreateMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Users size={16} className={isDarkMode ? 'text-[#E50914]' : 'text-[#E50914]'} />
                      New Group
                    </button>
                  </div>
                )}
              </div>

              {/* More Options Menu */}
              <div className="relative" ref={moreMenuRef}>
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`p-2 rounded-full transition-colors hidden md:block ${isDarkMode ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <MoreVertical size={20} />
                </button>

                {showMoreMenu && (
                  <div className={`absolute top-full right-0 mt-2 w-56 rounded-xl shadow-lg border z-50 overflow-hidden animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-100'}`}>
                    <button 
                      onClick={() => handleBulkAction('select')}
                      className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <CheckSquare size={16} className="text-gray-500" />
                      {isSelectionMode ? 'Cancel Selection' : 'Select Chats'}
                    </button>
                    <button 
                      onClick={() => handleBulkAction('archive')}
                      className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Archive size={16} className="text-gray-500" />
                      Archive Selected
                    </button>
                    <button 
                      onClick={() => handleBulkAction('delete')}
                      className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${isDarkMode ? 'text-red-400 hover:bg-[#222]' : 'text-red-600 hover:bg-gray-50'}`}
                    >
                      <Trash2 size={16} />
                      Delete Selected
                    </button>
                    <div className={`h-px mx-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
                    <button 
                      onClick={() => handleBulkAction('export')}
                      className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-[#222]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Download size={16} className="text-gray-500" />
                      Export Chats
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          {['Chats', 'My Groups', 'Unread', 'Archived'].map((item) => (
            <button
              key={item}
              onClick={() => {
              if (item === 'My Groups') {
                setFilter('groups');
              } else {
                const val = item.toLowerCase();
                if (val === 'chats' || val === 'groups' || val === 'unread' || val === 'archived') {
                  setFilter(val);
                }
              }
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              (filter === 'groups' && item === 'My Groups') || filter === item.toLowerCase()
                  ? 'bg-black text-white shadow-md' 
                  : isDarkMode ? 'bg-[#222] border border-gray-700 text-gray-400 hover:bg-[#333]' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          ))}
          <button
            onClick={onOpenDiscoverGroups}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${isDarkMode ? 'bg-[#222] border-[#E50914] text-[#E50914] hover:bg-[#E50914] hover:text-white' : 'bg-white border-[#E50914] text-[#E50914] hover:bg-[#E50914] hover:text-white'}`}
          >
            <Users size={12} />
            Discover Groups
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-4 space-y-1">
        {children}
      </div>
    </div>
  );
}
