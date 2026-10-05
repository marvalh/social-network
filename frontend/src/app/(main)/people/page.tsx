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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg shadow-purple-500/20">
            {' '}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.765Z"
              />
            </svg>
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
