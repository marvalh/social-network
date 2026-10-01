'use client';

import Link from 'next/link';
import type { Notification } from '@/src/types/notification';
import { getNotificationDisplay } from '@/src/utils/notificationDisplay';
import { relativeTime } from '@/src/utils/formatDate';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (notifId: string) => void;
  onNavigate?: () => void;
}

export function NotificationItem({ notification, onMarkRead, onNavigate }: NotificationItemProps) {
  const { icon: Icon, message, href } = getNotificationDisplay(notification.type);

  function markAsReadIfNeeded() {
    if (!notification.isRead) onMarkRead(notification.notifId);
  }

  const content = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500">
        <Icon className="size-4 text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-foreground">{message}</span>
        <span className="block text-xs text-muted-foreground">
          {relativeTime(notification.createdAt)}
        </span>
      </span>
      {!notification.isRead && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-pink-500" />
      )}
    </>
  );

  const className = `flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${
    !notification.isRead ? 'bg-primary/5' : ''
  }`;

  if (href) {
    return (
      <Link
        href={href}
        onClick={() => {
          markAsReadIfNeeded();
          onNavigate?.();
        }}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={markAsReadIfNeeded} className={className}>
      {content}
    </button>
  );
}