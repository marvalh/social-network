'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/src/context/Notifications';
import { NotificationItem } from '@/src/components/notifications/NotificationItem';

export function NotificationBell() {
  const { notifications, unreadCount, error, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recent = notifications.slice(0, 5);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/20">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
          </div>

          {recent.length === 0 ? (
            error ? (
              <p className="px-4 py-8 text-center text-sm text-destructive">{error}</p>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing yet.</p>
            )
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {recent.map((notification) => (
                <li key={notification.notifId}>
                  <NotificationItem
                    notification={notification}
                    onMarkRead={markRead}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-3 text-center text-sm font-medium text-brand-400 hover:bg-muted"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}