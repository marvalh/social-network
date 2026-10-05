'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '@/src/context/Socket';
import { useUnread } from '@/src/context/Unread';
import { chatApi } from '@/src/services/api';
import { mediaUrl } from '@/src/utils/media';
import { relativeTime } from '@/src/utils/formatDate';
import { isChatMessage, type Conversation } from '@/src/types/chat';

export function ConversationList() {
  const { subscribe } = useSocket();
  const { summary } = useUnread();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    chatApi
      .listConversations()
      .then(setConversations)
      .catch(() => {
        // keep what is on screen if a background refresh fails
      });
  }, []);

  useEffect(() => {
    chatApi
      .listConversations()
      .then(setConversations)
      .catch(() => setError('Could not load your conversations.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return subscribe((data) => {
      if (isChatMessage(data)) reload();
    });
  }, [subscribe, reload]);

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
        const unread = summary.direct[conversation.userId] ?? 0;
        return (
          <li key={conversation.userId}>
            <Link
              href={`/messages/${conversation.userId}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-brand-400">
                  {conversation.firstName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm text-foreground ${
                    unread > 0 ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {conversation.firstName} {conversation.lastName}
                </p>
                <p
                  className={`truncate text-sm ${
                    unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {conversation.lastMessage}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">
                  {relativeTime(conversation.lastMessageAt)}
                </span>
                {unread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sky-500 px-1.5 text-[11px] font-semibold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}