'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/src/context/Auth';
import { useSocket } from '@/src/context/Socket';
import { chatApi, groupsApi, profileApi } from '@/src/services/api';
import { isGroupChatMessage, isGroupTypingEvent, type GroupMessage } from '@/src/types/chat';
import type { GroupDetail as GroupDetailType } from '@/src/types/group';
import { GroupMessageBubble } from './GroupMessageBubble';
import { MessageComposer } from './MessageComposer';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { StatusError, statusOf, type ErrorStatus } from '@/src/components/layout/StatusError';

const TYPING_SEND_INTERVAL_MS = 2000;
const TYPING_INDICATOR_TIMEOUT_MS = 3000;

interface GroupChatWindowProps {
  groupId: string;
}

export function GroupChatWindow({ groupId }: GroupChatWindowProps) {
  const { user } = useAuth();
  const { subscribe, send } = useSocket();
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailure, setLoadFailure] = useState<ErrorStatus | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const requestedNamesRef = useRef<Set<string>>(new Set());
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastTypingSentRef = useRef(0);

  const ensureName = useCallback((id: string) => {
    if (requestedNamesRef.current.has(id)) return;
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
  }, []);

  useEffect(() => {
    groupsApi
      .get(groupId)
      .then(async (detail) => {
        setGroup(detail);
        if (detail.isMember) {
          setMessages(await chatApi.getGroupMessages(groupId));
        }
      })
      .catch((err) => setLoadFailure(statusOf(err)))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    const timers = typingTimersRef.current;

    function stopTyping(id: string) {
      const timer = timers.get(id);
      if (timer) clearTimeout(timer);
      timers.delete(id);
      setTypingIds((current) => current.filter((x) => x !== id));
    }

    const unsubscribe = subscribe((data) => {
      if (isGroupChatMessage(data) && data.groupId === groupId) {
        setMessages((current) => [...current, data]);
        stopTyping(data.senderId);
      }
      if (isGroupTypingEvent(data) && data.groupId === groupId) {
        const id = data.senderId;
        ensureName(id);
        setTypingIds((current) => (current.includes(id) ? current : [...current, id]));
        const existing = timers.get(id);
        if (existing) clearTimeout(existing);
        timers.set(
          id,
          setTimeout(() => stopTyping(id), TYPING_INDICATOR_TIMEOUT_MS)
        );
      }
    });

    return () => {
      unsubscribe();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [subscribe, groupId, ensureName]);

  useEffect(() => {
    for (const message of messages) {
      if (message.senderId === user?.userId) continue;
      ensureName(message.senderId);
    }
  }, [messages, user?.userId, ensureName]);

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

  function handleTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_SEND_INTERVAL_MS) return;
    lastTypingSentRef.current = now;
    send({ type: 'typing', groupId });
  }

  if (loadFailure) return <StatusError status={loadFailure} />;

  const typingNames = typingIds.map((id) => names[id] ?? 'Someone');
  let typingText = '';
  if (typingNames.length === 1) {
    typingText = `${typingNames[0]} is typing…`;
  } else if (typingNames.length === 2) {
    typingText = `${typingNames[0]} and ${typingNames[1]} are typing…`;
  } else if (typingNames.length > 2) {
    typingText = 'Several people are typing…';
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col rounded-2xl bg-card ring-1 ring-white/10 lg:h-[calc(100vh-10rem)]">
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

      {typingText && (
        <p className="px-4 pb-1 text-xs text-muted-foreground">
          <span className="animate-pulse">{typingText}</span>
        </p>
      )}

      {group?.isMember && <MessageComposer onSend={handleSend} onTyping={handleTyping} />}
    </div>
  );
}