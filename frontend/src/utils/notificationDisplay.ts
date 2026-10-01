import { CalendarPlus, UserPlus, Users, UsersRound, type LucideIcon } from 'lucide-react';
import type { NotificationType } from '@/src/types/notification';

interface NotificationDisplay {
  icon: LucideIcon;
  message: string;
  href?: string;
}

export function getNotificationDisplay(type: NotificationType): NotificationDisplay {
  switch (type) {
    case 'follow_request':
      return { icon: UserPlus, message: 'Someone wants to follow you', href: '/follow' };
    case 'group_invite':
      return { icon: Users, message: 'You were invited to join a group' };
    case 'group_join_request':
      return { icon: UsersRound, message: 'Someone requested to join your group' };
    case 'group_event':
      return { icon: CalendarPlus, message: 'A new event was created in one of your groups' };
  }
}