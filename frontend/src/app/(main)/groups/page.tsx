'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { GroupsList } from '@/src/components/groups/GroupsList';
import { buttonVariants } from '@/components/ui/button';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

export default function GroupsPage() {
  const { checking } = useRequireAuth();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Groups</h1>
          <p className="text-sm text-muted-foreground">Join a group or start your own.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/groups/invites"
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            Invites
          </Link>
          <Link href="/groups/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4" />
            Create Group
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <GroupsList />
      </div>
    </main>
  );
}
