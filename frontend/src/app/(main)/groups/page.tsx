'use client';

import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
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
            <Users className="h-6 w-6" strokeWidth={1.75} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Groups</h1>
            <p className="mt-0.5 text-sm text-slate-400">Your groups, and more to discover.</p>
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