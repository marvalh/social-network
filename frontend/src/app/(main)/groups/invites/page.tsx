'use client';

import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { GroupInvitesList } from '@/src/components/groups/GroupInvites';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

export default function GroupInvitesPage() {
  const { checking } = useRequireAuth();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Group Invites</h1>
        <p className="text-sm text-muted-foreground">Groups you've been invited to join.</p>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <GroupInvitesList />
      </div>
    </main>
  );
}