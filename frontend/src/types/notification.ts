export type NotificationType =
  | 'follow_request'
  | 'follow_accepted'
  | 'new_follower'
  | 'group_invite'
  | 'group_join_request'
  | 'group_event'
  | 'post_like'
  | 'post_comment'
  | 'comment_like';

export interface Notification {
  notifId: string;
  userId: string;
  type: NotificationType;
  referenceId?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  isRead: boolean;
  createdAt: string;
}

// The live push carries the full notification, same shape as the list.
export type NotificationPush = Notification;