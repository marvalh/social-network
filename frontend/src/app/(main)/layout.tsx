'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/Auth';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { Topbar } from '@/src/components/layout/Topbar';
import { NotificationsProvider } from '@/src/context/Notifications';
import { ToastProvider } from '@/src/context/Toasts';
import { UnreadProvider } from '@/src/context/Unread';
import { ConnectionBanner } from '@/src/components/layout/ConnectionBanner';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) return <FullPageSpinner />;

  return (
    <div className="min-h-screen bg-canvas">
      <NotificationsProvider>
        <ToastProvider>
          <UnreadProvider>
            <Topbar />
            <ConnectionBanner />
            <div className="mx-auto flex max-w-7xl flex-col px-2 pb-16 sm:px-6 lg:flex-row lg:gap-6 lg:pb-0">
              <Sidebar />
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </UnreadProvider>
        </ToastProvider>
      </NotificationsProvider>
    </div>
  );
}