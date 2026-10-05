'use client';

import { useState } from 'react';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { ConversationList } from '@/src/components/chat/ConversationList';
import { GroupChatList } from '@/src/components/chat/GroupChatList';
import { useUnread } from '@/src/context/Unread';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';

type Tab = 'direct' | 'groups';

const TABS: { key: Tab; label: string }[] = [
  { key: 'direct', label: 'Direct messages' },
  { key: 'groups', label: 'Groups' },
];

export default function MessagesPage() {
  const { checking } = useRequireAuth();
  const { summary } = useUnread();
  const [tab, setTab] = useState<Tab>('direct');

  if (checking) {
    return <FullPageSpinner />;
  }

  const counts: Record<Tab, number> = {
    direct: summary.directTotal,
    groups: summary.groupsTotal,
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">Your conversations.</p>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-white/10">
        <div className="flex gap-1 border-b border-border px-2 pt-1" role="tablist">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                tab === key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span className="ml-1.5 rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {counts[key] > 9 ? '9+' : counts[key]}
                </span>
              )}
              {tab === key && (
                <span className="gradient absolute inset-x-3 -bottom-px h-0.5 rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="p-4">{tab === 'direct' ? <ConversationList /> : <GroupChatList />}</div>
      </div>
    </main>
  );
}