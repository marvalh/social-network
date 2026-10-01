'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './Auth';
import { useSocket } from './Socket';
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

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (notifId: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
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
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

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

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, markRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return ctx;
}
