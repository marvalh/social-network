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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, UsersRound, X, type LucideIcon } from 'lucide-react';
import { useNotifications } from './Notifications';
import { useSocket } from './Socket';
import { groupsApi, profileApi } from '@/src/services/api';
import { isChatMessage, isGroupChatMessage } from '@/src/types/chat';
import type { Notification } from '@/src/types/notification';
import { mediaUrl } from '@/src/utils/media';
import { getNotificationDisplay } from '@/src/utils/notificationDisplay';

const TOAST_MS = 5000;
const MAX_TOASTS = 3;

interface Toast {
  id: string;
  /** Toasts with the same key replace each other, so a burst of messages is one toast. */
  key: string;
  title: string;
  body?: string;
  href: string;
  avatarUrl?: string;
  initial: string;
  badge: LucideIcon;
  onOpen?: () => void;
}

type ToastInput = Omit<Toast, 'id'>;

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function isNotificationEvent(data: unknown): data is Notification {
  return (
    typeof data === 'object' &&
    data !== null &&
    'notifId' in data &&
    'type' in data &&
    !('receiverId' in data) &&
    !('groupId' in data)
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { subscribe } = useSocket();
  const { markRead } = useNotifications();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const nextIdRef = useRef(0);
  const pathnameRef = useRef(pathname);
  const usersRef = useRef<Map<string, { name: string; avatar?: string }>>(new Map());
  const groupsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      nextIdRef.current += 1;
      const id = `toast-${nextIdRef.current}`;
      setToasts((current) => {
        const kept = current.filter((toast) => toast.key !== input.key);
        return [...kept, { ...input, id }].slice(-MAX_TOASTS);
      });
      timersRef.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_MS)
      );
    },
    [dismiss]
  );

  const lookupUser = useCallback(async (userId: string) => {
    const cached = usersRef.current.get(userId);
    if (cached) return cached;
    try {
      const profile = await profileApi.get(userId);
      const info = {
        name: `${profile.user.firstName} ${profile.user.lastName}`,
        avatar: profile.user.avatar,
      };
      usersRef.current.set(userId, info);
      return info;
    } catch {
      return { name: 'Someone', avatar: undefined };
    }
  }, []);

  const lookupGroup = useCallback(async (groupId: string) => {
    const cached = groupsRef.current.get(groupId);
    if (cached) return cached;
    try {
      const group = await groupsApi.get(groupId);
      groupsRef.current.set(groupId, group.title);
      return group.title;
    } catch {
      return 'Group chat';
    }
  }, []);

  useEffect(() => {
    return subscribe((data) => {
      const path = pathnameRef.current;

      if (isNotificationEvent(data)) {
        if (path.startsWith('/notifications')) return;
        const display = getNotificationDisplay(data);
        showToast({
          key: `notif:${data.notifId}`,
          title: display.message,
          href: display.href ?? '/notifications',
          avatarUrl: mediaUrl(data.actorAvatar),
          initial: (data.actorName || '?').charAt(0),
          badge: display.icon,
          onOpen: () => {
            markRead(data.notifId);
          },
        });
        return;
      }

      if (isChatMessage(data)) {
        if (path === `/messages/${data.senderId}`) return;
        lookupUser(data.senderId).then((sender) =>
          showToast({
            key: `dm:${data.senderId}`,
            title: sender.name,
            body: data.content,
            href: `/messages/${data.senderId}`,
            avatarUrl: mediaUrl(sender.avatar),
            initial: sender.name.charAt(0),
            badge: MessageCircle,
          })
        );
        return;
      }

      if (isGroupChatMessage(data)) {
        if (path === `/groups/${data.groupId}/chat`) return;
        Promise.all([lookupUser(data.senderId), lookupGroup(data.groupId)]).then(
          ([sender, title]) =>
            showToast({
              key: `group:${data.groupId}`,
              title,
              body: `${sender.name}: ${data.content}`,
              href: `/groups/${data.groupId}/chat`,
              initial: title.charAt(0),
              badge: UsersRound,
            })
        );
      }
    });
  }, [subscribe, showToast, markRead, lookupUser, lookupGroup]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-20 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Badge = toast.badge;

  return (
    <div className="pointer-events-auto flex animate-in items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-2xl shadow-black/30 duration-200 fade-in slide-in-from-right-4">
      <Link
        href={toast.href}
        onClick={() => {
          toast.onOpen?.();
          onDismiss();
        }}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <span className="relative shrink-0">
          {toast.avatarUrl ? (
            <img src={toast.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
          ) : (
            <span className="grid size-9 place-items-center rounded-full bg-secondary text-sm font-semibold text-brand-400">
              {toast.initial}
            </span>
          )}
          <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 ring-2 ring-card">
            <Badge className="size-2.5 text-white" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-sm font-medium text-foreground">
            {toast.title}
          </span>
          {toast.body && (
            <span className="block truncate text-xs text-muted-foreground">{toast.body}</span>
          )}
        </span>
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
