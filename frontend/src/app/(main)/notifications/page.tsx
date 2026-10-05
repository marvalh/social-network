'use client';

import { Button } from '@/components/ui/button';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { NotificationItem } from '@/src/components/notifications/NotificationItem';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { useNotifications } from '@/src/context/Notifications';

export default function NotificationsPage() {
  const { checking } = useRequireAuth();
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Everything that&apos;s happened lately.</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={() => markAllRead()}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : notifications.length === 0 ? (
          error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>
          )
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((notification) => (
              <li key={notification.notifId}>
                <NotificationItem notification={notification} onMarkRead={markRead} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}