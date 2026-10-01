'use client';

import { use } from 'react';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { ChatWindow } from '@/src/components/chat/ChatWindow';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

export default function MessageThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { checking } = useRequireAuth();

  if (checking) {
    return <FullPageSpinner />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <ChatWindow otherUserId={userId} />
    </main>
  );
}