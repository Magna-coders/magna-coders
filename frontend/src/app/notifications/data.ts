export const MOCK_NOTIFICATIONS = [];

export interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}
