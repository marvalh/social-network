'use client';

import { useEffect, useRef } from 'react';
import { useSocket } from '@/src/context/Socket';
import { isLiveEvent, type LiveTopic } from '@/src/types/live';

const COALESCE_MS = 150;

/**
 * Calls onChange when the backend says data under `topic` changed.
 * Also calls it once after the socket reconnects, to catch up on anything missed.
 * Pass `id` to only react to events about one group.
 */
export function useLive(topic: LiveTopic, onChange: () => void, id?: string) {
  const { subscribe, connected } = useSocket();
  const callbackRef = useRef(onChange);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasConnectedRef = useRef(connected);

  useEffect(() => {
    callbackRef.current = onChange;
  });

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (!isLiveEvent(data) || data.topic !== topic) return;
      if (id && data.id && data.id !== id) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(), COALESCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [subscribe, topic, id]);

  useEffect(() => {
    if (connected && !wasConnectedRef.current) callbackRef.current();
    wasConnectedRef.current = connected;
  }, [connected]);
}
