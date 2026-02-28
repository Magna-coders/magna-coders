
import React from 'react';
import { 
  Heart, 
  MessageSquare, 
  UserPlus, 
  FolderKanban, 
  Briefcase, 
  Info, 
  Bell, 
  Check, 
  X 
} from 'lucide-react';
import { Notification, NotificationType } from '@/app/notifications/data';

interface NotificationItemProps {
  notification: Notification;
  isDarkMode: boolean;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  onAccept?: (id: number, e: React.MouseEvent) => void;
  onDecline?: (id: number, e: React.MouseEvent) => void;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'like': return <Heart size={16} className="text-[#E50914] fill-[#E50914]" />;
    case 'comment': return <MessageSquare size={16} className="text-[#F4A261]" />;
    case 'connection_request': 
    case 'connection_accepted': return <UserPlus size={16} className="text-[#0077b5]" />;
    case 'project_invite':
    case 'project_application': 
    case 'project_request':
    case 'project_approved':
      return <FolderKanban size={16} className="text-[#F4A261]" />;
    case 'job_request':
    case 'job_approved':
      return <Briefcase size={16} className="text-[#25D366]" />;
    case 'system': return <Info size={16} className="text-gray-500" />;
    default: return <Bell size={16} className="text-gray-500" />;
  }
};

export default function NotificationItem({ 
  notification, 
  isDarkMode, 
  onMarkAsRead, 
  onDelete,
  onAccept,
  onDecline
}: NotificationItemProps) {
  return (
    <div 
      onClick={() => onMarkAsRead(notification.id)}
      className={`group relative flex items-start gap-4 p-5 rounded-2xl transition-all cursor-pointer border-l-4 ${
        notification.read 
          ? isDarkMode ? 'bg-transparent border-transparent hover:bg-[#111]' : 'bg-transparent border-transparent hover:bg-white hover:shadow-sm'
          : isDarkMode ? 'bg-[#111] border-[#E50914]' : 'bg-white border-[#E50914] shadow-sm'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {notification.actor.avatar ? (
          <img src={notification.actor.avatar} alt={notification.actor.name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {notification.actor.initials}
          </div>
        )}
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-sm border ${
          isDarkMode ? 'bg-[#222] border-black' : 'bg-white border-white'
        }`}>
          {getIcon(notification.type)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="pr-8">
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{notification.actor.name}</span>{' '}
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{notification.content}</span>{' '}
              {notification.target && <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>"{notification.target}"</span>}
            </p>
            <span className={`text-xs mt-1.5 block font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{notification.timestamp}</span>
          </div>
        </div>

        {/* Action Buttons (for Requests) */}
        {notification.actionRequired && notification.requestStatus === 'pending' && onAccept && onDecline && (
          <div className="flex gap-3 mt-4">
            <button 
              onClick={(e) => onAccept(notification.id, e)}
              className="px-6 py-2 rounded-full bg-[#E50914] text-white text-xs font-bold hover:bg-[#cc0812] transition-all shadow-md flex items-center gap-2"
            >
              <Check size={14} />
              Accept
            </button>
            <button 
              onClick={(e) => onDecline(notification.id, e)}
              className={`px-6 py-2 rounded-full border text-xs font-bold transition-all ${
              isDarkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-[#222] hover:text-white' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black'
            }`}>
              Decline
            </button>
          </div>
        )}
        
        {/* Status Feedback */}
        {notification.requestStatus === 'accepted' && (
          <div className="mt-3 text-xs font-bold text-[#25D366] flex items-center gap-1.5 bg-[#25D366]/10 w-fit px-3 py-1 rounded-full">
            <Check size={12} />
            Request Accepted
          </div>
        )}
        {notification.requestStatus === 'declined' && (
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 w-fit px-3 py-1 rounded-full">
            <X size={12} />
            Request Declined
          </div>
        )}
      </div>
      
      {/* Delete Button (visible on hover) */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className={`absolute top-4 right-4 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
          isDarkMode ? 'text-gray-500 hover:bg-[#222] hover:text-[#E50914]' : 'text-gray-300 hover:bg-gray-100 hover:text-[#E50914]'
        }`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
