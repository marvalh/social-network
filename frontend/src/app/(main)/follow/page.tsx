'use client';

import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { BackLink } from '@/src/components/layout/BackLink';
import { FollowRequestsList } from '@/src/components/follow/FollowRequests';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

export default function FollowRequestsPage() {
  const { checking } = useRequireAuth();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <BackLink href="/people" label="People" />

      <div>
        <h1 className="text-xl font-semibold">Follow Requests</h1>
        <p className="text-sm text-muted-foreground">People who want to follow you.</p>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <FollowRequestsList />
      </div>
    </main>
  );
}