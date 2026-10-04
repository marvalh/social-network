'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/src/context/Auth';
import { useSocket } from '@/src/context/Socket';
import { chatApi, profileApi } from '@/src/services/api';
import { isChatMessage, isTypingEvent, type Message } from '@/src/types/chat';
import { mediaUrl } from '@/src/utils/media';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';

const TYPING_SEND_INTERVAL_MS = 2000;
const TYPING_INDICATOR_TIMEOUT_MS = 3000;

interface ChatWindowProps {
  otherUserId: string;
}

export function ChatWindow({ otherUserId }: ChatWindowProps) {
  const { user } = useAuth();
  const { subscribe, send } = useSocket();
  const [otherName, setOtherName] = useState<string | null>(null);
  const [otherAvatar, setOtherAvatar] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    Promise.all([profileApi.get(otherUserId), chatApi.getConversation(otherUserId)])
      .then(([profile, history]) => {
        setOtherName(`${profile.user.firstName} ${profile.user.lastName}`);
        setOtherAvatar(profile.user.avatar);
        setMessages(history);
      })
      .catch(() => setError('Could not load this conversation.'))
      .finally(() => setLoading(false));
  }, [otherUserId]);

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (isChatMessage(data) && data.senderId === otherUserId) {
        setMessages((current) => [...current, data]);
      }
      if (isTypingEvent(data) && data.senderId === otherUserId) {
        setOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setOtherTyping(false),
          TYPING_INDICATOR_TIMEOUT_MS
        );
      }
    });
    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [subscribe, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(content: string) {
    if (!user) return;
    const { chatId } = await chatApi.sendMessage(otherUserId, content);
    setMessages((current) => [
      ...current,
      {
        chatId,
        senderId: user.userId,
        receiverId: otherUserId,
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
    send({ type: 'typing', receiverId: otherUserId });
  }

  const avatarUrl = mediaUrl(otherAvatar);

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col rounded-2xl bg-card ring-1 ring-white/10 lg:h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href="/messages"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="size-4" />
        </Link>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          <div className="grid size-9 place-items-center rounded-full bg-secondary text-sm font-semibold text-brand-400">
            {otherName?.charAt(0) ?? '?'}
          </div>
        )}
        <p className="text-sm font-medium text-foreground">{otherName ?? '...'}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <FullPageSpinner />
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">{error}</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Say hello to start the conversation.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.chatId}
              message={message}
              isOwn={message.senderId === user?.userId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {otherTyping && (
        <p className="px-4 pb-1 text-xs text-muted-foreground">
          <span className="animate-pulse">{otherName} is typing…</span>
        </p>
      )}

      <MessageComposer onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
