'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './Auth';
import { useSocket } from './Socket';
import { useLive } from '@/src/hooks/useLive';
import { chatApi } from '@/src/services/api';
import { isChatMessage, isGroupChatMessage, type UnreadSummary } from '@/src/types/chat';

const EMPTY: UnreadSummary = { direct: {}, groups: {}, directTotal: 0, groupsTotal: 0, total: 0 };

interface UnreadContextValue {
  summary: UnreadSummary;
  markDirectRead: (userId: string) => Promise<void>;
  markGroupRead: (groupId: string) => Promise<void>;
}

const UnreadContext = createContext<UnreadContextValue | undefined>(undefined);

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [summary, setSummary] = useState<UnreadSummary>(EMPTY);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const refresh = useCallback(async () => {
    try {
      setSummary(await chatApi.unread());
    } catch {
      // keep the last known counts
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  // Another tab marked something read, or the socket reconnected.
  useLive('unread', refresh);

  // Catch up when the tab comes back into view.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState === 'visible') refresh();
    }
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [refresh]);

  // A new message arrived. The chat you are looking at marks itself read, so skip that one.
  useEffect(() => {
    return subscribe((data) => {
      const path = pathnameRef.current;
      const visible = document.visibilityState === 'visible';

      if (isChatMessage(data)) {
        if (visible && path === `/messages/${data.senderId}`) return;
        refresh();
        return;
      }

      if (isGroupChatMessage(data)) {
        if (visible && path === `/groups/${data.groupId}/chat`) return;
        refresh();
      }
    });
  }, [subscribe, refresh]);

  const markDirectRead = useCallback(
    async (userId: string) => {
      setSummary((current) => {
        const count = current.direct[userId] ?? 0;
        if (count === 0) return current;
        const direct = { ...current.direct };
        delete direct[userId];
        return {
          ...current,
          direct,
          directTotal: current.directTotal - count,
          total: current.total - count,
        };
      });
      try {
        await chatApi.markRead(userId);
      } catch {
        refresh();
      }
    },
    [refresh]
  );

  const markGroupRead = useCallback(
    async (groupId: string) => {
      setSummary((current) => {
        const count = current.groups[groupId] ?? 0;
        if (count === 0) return current;
        const groups = { ...current.groups };
        delete groups[groupId];
        return {
          ...current,
          groups,
          groupsTotal: current.groupsTotal - count,
          total: current.total - count,
        };
      });
      try {
        await chatApi.markGroupRead(groupId);
      } catch {
        refresh();
      }
    },
    [refresh]
  );

  const value = useMemo(
    () => ({ summary, markDirectRead, markGroupRead }),
    [summary, markDirectRead, markGroupRead]
  );

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function useUnread() {
  const ctx = useContext(UnreadContext);
  if (!ctx) {
    throw new Error('useUnread must be used within an UnreadProvider');
  }
  return ctx;
}
