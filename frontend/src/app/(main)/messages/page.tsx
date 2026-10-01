'use client';

import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { ConversationList } from '@/src/components/chat/ConversationList';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

export default function MessagesPage() {
  const { checking } = useRequireAuth();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">Your conversations.</p>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <ConversationList />
      </div>
    </main>
  );
}