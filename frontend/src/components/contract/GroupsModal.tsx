import React from 'react';
import { X, Users, MessageCircle, Plus, Settings, UserPlus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  members: number;
  unread: number;
  lastMessage?: string;
  lastActivity?: string;
}

interface GroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: Group[];
}

const defaultGroups: Group[] = [
  { id: '1', name: 'General Discussion', members: 8, unread: 2, lastMessage: 'Project kickoff meeting scheduled', lastActivity: '2 hours ago' },
  { id: '2', name: 'Development Team', members: 5, unread: 0, lastMessage: 'Code review completed', lastActivity: '1 day ago' },
  { id: '3', name: 'Design Reviews', members: 4, unread: 5, lastMessage: 'New mockups are ready', lastActivity: '3 hours ago' },
  { id: '4', name: 'Client Updates', members: 3, unread: 0, lastMessage: 'Weekly status report sent', lastActivity: '1 week ago' }
];

export const GroupsModal: React.FC<GroupsModalProps> = ({ 
  isOpen, 
  onClose, 
  groups = defaultGroups 
}) => {
  if (!isOpen) return null;

  const handleCreateGroup = () => {
    console.log('Creating new group...');
  };

  const handleJoinGroup = (groupId: string) => {
    console.log(`Joining group ${groupId}...`);
  };

  const handleGroupSettings = (groupId: string) => {
    console.log(`Opening settings for group ${groupId}...`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Project Groups</h2>
            <p className="text-sm text-gray-400 mt-1">{groups.length} active groups</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCreateGroup}
              className="px-4 py-2 rounded-lg bg-[#E70008] hover:bg-[#ff1f29] text-white transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Create Group
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {groups.map((group) => (
              <div 
                key={group.id}
                className="group bg-[#0a0a0a] border border-white/5 rounded-xl p-4 hover:border-white/10 hover:bg-white/5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center">
                        <Users size={20} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium group-hover:text-[#E70008] transition-colors">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {group.members} members
                          </span>
                          {group.lastActivity && (
                            <>
                              <span>•</span>
                              <span>{group.lastActivity}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {group.lastMessage && (
                      <p className="text-sm text-gray-400 truncate ml-13">
                        {group.lastMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {group.unread > 0 && (
                      <span className="w-5 h-5 bg-[#E70008] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {group.unread > 99 ? '99+' : group.unread}
                      </span>
                    )}
                    <button 
                      onClick={() => handleGroupSettings(group.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 ml-13">
                  <button 
                    onClick={() => handleJoinGroup(group.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#E70008] hover:bg-[#ff1f29] text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <MessageCircle size={14} />
                    Open Chat
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2">
                    <UserPlus size={14} />
                    Invite
                  </button>
                </div>
              </div>
            ))}
          </div>

          {groups.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No groups yet</h3>
              <p className="text-gray-500 mb-6">Create your first group to start collaborating</p>
              <button 
                onClick={handleCreateGroup}
                className="px-6 py-3 rounded-lg bg-[#E70008] hover:bg-[#ff1f29] text-white transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Create First Group
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <p className="text-sm text-gray-500">
            {groups.reduce((acc, group) => acc + group.members, 0)} total members across {groups.length} groups
          </p>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};