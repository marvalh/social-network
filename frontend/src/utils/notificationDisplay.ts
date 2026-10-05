import {
  CalendarPlus,
  Heart,
  MessageCircle,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { Notification } from '@/src/types/notification';

interface NotificationDisplay {
  icon: LucideIcon;
  message: string;
  href?: string;
}

export function getNotificationDisplay(notification: Notification): NotificationDisplay {
  const who = notification.actorName || 'Someone';
  const ref = notification.referenceId;
  const actorProfile = notification.actorId ? `/profile/${notification.actorId}` : undefined;
  const post = ref ? `/posts/${ref}` : undefined;

  switch (notification.type) {
    case 'follow_request':
      return { icon: UserPlus, message: `${who} wants to follow you`, href: '/follow' };
    case 'follow_accepted':
      return {
        icon: UserCheck,
        message: `${who} accepted your follow request`,
        href: actorProfile,
      };
    case 'new_follower':
      return { icon: UserPlus, message: `${who} started following you`, href: actorProfile };
    case 'group_invite':
      return {
        icon: Users,
        message: `${who} invited you to join a group`,
        href: '/groups/invites',
      };
    case 'group_join_request':
      return {
        icon: UsersRound,
        message: `${who} requested to join your group`,
        href: ref ? `/groups/${ref}` : '/groups',
      };
    case 'group_event':
      return {
        icon: CalendarPlus,
        message: `${who} created a new event in your group`,
        href: ref ? `/groups/${ref}/events` : '/groups',
      };
    case 'post_like':
      return { icon: Heart, message: `${who} liked your post`, href: post };
    case 'post_comment':
      return { icon: MessageCircle, message: `${who} commented on your post`, href: post };
    case 'comment_like':
      return { icon: Heart, message: `${who} liked your comment`, href: post };
  }
}
