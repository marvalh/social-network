export type NotificationType =
  | 'follow_request'
  | 'group_invite'
  | 'group_join_request'
  | 'group_event';

export interface Notification {
  notifId: string;
  userId: string;
  type: NotificationType;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPush {
  notifId: string;
  type: NotificationType;
}