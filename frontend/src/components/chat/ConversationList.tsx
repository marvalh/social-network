'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { chatApi } from '@/src/services/api';
import { mediaUrl } from '@/src/utils/media';
import { relativeTime } from '@/src/utils/formatDate';
import type { Conversation } from '@/src/types/chat';

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    chatApi
      .listConversations()
      .then(setConversations)
      .catch(() => setError('Could not load your conversations.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-destructive">{error}</p>;
  }

  if (conversations.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No conversations yet. Message someone you follow to start one.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((conversation) => {
        const avatarUrl = mediaUrl(conversation.avatar);
        return (
          <li key={conversation.userId}>
            <Link
              href={`/messages/${conversation.userId}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-11 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-brand-400">
                  {conversation.firstName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {conversation.firstName} {conversation.lastName}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {conversation.lastMessage}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {relativeTime(conversation.lastMessageAt)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}