'use client';

import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { FollowRequestsLink } from '@/src/components/follow/FollowRequestsLink';
import { PeopleList } from '@/src/components/follow/PeopleList';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

export default function PeoplePage() {
  const { checking } = useRequireAuth();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">People</h1>
        <p className="text-sm text-muted-foreground">Follow requests and people you may know.</p>
      </div>

      <FollowRequestsLink />

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <h2 className="mb-3 text-sm font-semibold">Suggested users</h2>
        <PeopleList />
      </div>
    </main>
  );
}