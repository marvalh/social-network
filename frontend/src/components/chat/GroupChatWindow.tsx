'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/src/context/Auth';
import { useSocket } from '@/src/context/Socket';
import { chatApi, groupsApi, profileApi } from '@/src/services/api';
import { isGroupChatMessage, type GroupMessage } from '@/src/types/chat';
import type { GroupDetail as GroupDetailType } from '@/src/types/group';
import { GroupMessageBubble } from './GroupMessageBubble';
import { MessageComposer } from './MessageComposer';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';

interface GroupChatWindowProps {
  groupId: string;
}

export function GroupChatWindow({ groupId }: GroupChatWindowProps) {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const requestedNamesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    groupsApi
      .get(groupId)
      .then(async (detail) => {
        setGroup(detail);
        if (detail.isMember) {
          setMessages(await chatApi.getGroupMessages(groupId));
        }
      })
      .catch(() => setError('Could not load this group chat.'))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    return subscribe((data) => {
      if (isGroupChatMessage(data) && data.groupId === groupId) {
        setMessages((current) => [...current, data]);
      }
    });
  }, [subscribe, groupId]);

  useEffect(() => {
    for (const message of messages) {
      const id = message.senderId;
      if (id === user?.userId || requestedNamesRef.current.has(id)) continue;
      requestedNamesRef.current.add(id);
      profileApi
        .get(id)
        .then((profile) =>
          setNames((current) => ({
            ...current,
            [id]: `${profile.user.firstName} ${profile.user.lastName}`,
          }))
        )
        .catch(() => setNames((current) => ({ ...current, [id]: 'Member' })));
    }
  }, [messages, user?.userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(content: string) {
    if (!user) return;
    const { chatId } = await chatApi.sendGroupMessage(groupId, content);
    setMessages((current) => [
      ...current,
      {
        chatId,
        senderId: user.userId,
        groupId,
        content,
        readAt: { Time: '', Valid: false },
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col rounded-2xl bg-card ring-1 ring-white/10">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href={`/groups/${groupId}`}
          aria-label="Back to group"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <p className="text-sm font-medium text-foreground">{group?.title ?? '...'}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <FullPageSpinner />
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">{error}</p>
        ) : group && !group.isMember ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Join this group to see its chat.
          </p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to the group.
          </p>
        ) : (
          messages.map((message) => (
            <GroupMessageBubble
              key={message.chatId}
              message={message}
              isOwn={message.senderId === user?.userId}
              senderName={names[message.senderId]}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {group?.isMember && <MessageComposer onSend={handleSend} />}
    </div>
  );
}
