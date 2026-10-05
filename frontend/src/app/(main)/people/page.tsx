'use client';

import { UserPlus } from 'lucide-react';
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg shadow-purple-500/20">
            <UserPlus className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">People</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Follow requests and people you may know.
            </p>
          </div>
        </div>
      </div>

      <FollowRequestsLink />

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <h2 className="mb-3 text-sm font-semibold">Suggested users</h2>
        <PeopleList />
      </div>
    </main>
  );
}