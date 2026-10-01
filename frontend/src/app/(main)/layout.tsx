'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/Auth';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { Topbar } from '@/src/components/layout/Topbar';
import { NotificationsProvider } from '@/src/context/Notifications';

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
        <Topbar />
        {children}
      </NotificationsProvider>
    </div>
  );
}