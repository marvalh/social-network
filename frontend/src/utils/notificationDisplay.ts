import { CalendarPlus, UserPlus, Users, UsersRound, type LucideIcon } from 'lucide-react';
import type { Notification } from '@/src/types/notification';

interface NotificationDisplay {
  icon: LucideIcon;
  message: string;
  href?: string;
}

export function getNotificationDisplay(notification: Notification): NotificationDisplay {
  const who = notification.actorName || 'Someone';
  const ref = notification.referenceId;

  switch (notification.type) {
    case 'follow_request':
      return { icon: UserPlus, message: `${who} wants to follow you`, href: '/follow' };
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
  }
}