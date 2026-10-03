'use client';

import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
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
        <h1 className="text-xl font-semibold">Suggested Users</h1>
        <p className="text-sm text-muted-foreground">People you may know :</p>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <PeopleList />
      </div>
    </main>
  );
}