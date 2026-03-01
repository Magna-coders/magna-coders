export const MOCK_NOTIFICATIONS = [];

export type NotificationType = 
  | 'like'
  | 'comment'
  | 'connection_request'
  | 'connection_accepted'
  | 'project_invite'
  | 'project_application'
  | 'project_request'
  | 'project_approved'
  | 'job_request'
  | 'job_approved'
  | 'system';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  timestamp: string;
  read: boolean;
  actor: {
    name: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  target?: string;
  actionRequired?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'declined';
}
