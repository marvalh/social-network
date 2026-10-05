'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './Auth';
import { useSocket } from './Socket';
import { useLive } from '@/src/hooks/useLive';
import { ApiError, notificationsApi } from '@/src/services/api';
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
  error: string | null;
  markRead: (notifId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { subscribe, connected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load notifications.');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  // Catch up on anything missed while the socket was down.
  useEffect(() => {
    if (connected) refresh();
  }, [connected, refresh]);

  // Catch up when the tab comes back into view.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState === 'visible') refresh();
    }
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [refresh]);

  useEffect(() => {
    return subscribe((data) => {
      if (isNotificationPush(data)) {
        refresh();
      }
    });
  }, [subscribe, refresh]);

  // A notification was removed (a request or invite was cancelled) or read in another tab.
  useLive('notifications', refresh);

  const markRead = useCallback(async (notifId: string) => {
    try {
      await notificationsApi.markRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.notifId === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // leave it unread so the user can click it again
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // leave everything as it was so the user can try again
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, error, markRead, markAllRead }}
    >
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