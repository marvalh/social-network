'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { GroupsList } from '@/src/components/groups/GroupsList';
import { MyGroupsList } from '@/src/components/groups/MyGroupsList';
import { buttonVariants } from '@/components/ui/button';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

export default function GroupsPage() {
  const { checking } = useRequireAuth();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-900/40 text-purple-300 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Groups
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Your groups, and more to discover.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/groups/invites" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
            Invites
          </Link>
          <Link href="/groups/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4" />
            Create Group
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <h2 className="text-sm font-semibold">My Groups</h2>
        <div className="mt-3">
          <MyGroupsList />
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <h2 className="text-sm font-semibold">Discover</h2>
        <div className="mt-3">
          <GroupsList />
        </div>
      </div>
    </main>
  );
}