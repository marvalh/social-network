'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '@/src/context/Socket';
import { notificationsApi } from '@/src/services/api';
import type { Notification, NotificationPush } from '@/src/types/notification';

function isNotificationPush(data: unknown): data is NotificationPush {
  return (
    typeof data === 'object' &&
    data !== null &&
    'notifId' in data &&
    'type' in data &&
    !('receiverId' in data) &&
    !('groupId' in data)
  );
}

export function useNotifications() {
  const { subscribe } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await notificationsApi.list();
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    return subscribe((data) => {
      if (isNotificationPush(data)) {
        refresh();
      }
    });
  }, [subscribe, refresh]);

  const markRead = useCallback(async (notifId: string) => {
    await notificationsApi.markRead(notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.notifId === notifId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, loading, markRead };
}