'use client';

import { use } from 'react';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { GroupEvents } from '@/src/components/groups/GroupEvents';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

export default function GroupEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { checking } = useRequireAuth();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <GroupEvents groupId={id} />
    </main>
  );
}