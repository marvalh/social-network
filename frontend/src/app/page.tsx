'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/Auth';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');       //this file is responsible for rendering at '/', so login renders at /login
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <FullPageSpinner />;
  }
//supposed to render the homepage(feed), so for now kept this as its placeholder 
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-lg">Welcome back, {user.firstName}!</p>
      <Button variant="outline" onClick={() => logout()}>
        Log out
      </Button>
    </main>
  );
}