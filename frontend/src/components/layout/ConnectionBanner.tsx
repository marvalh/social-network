'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useSocket } from '@/src/context/Socket';

const SHOW_AFTER_MS = 3000;

export function ConnectionBanner() {
  const { connected } = useSocket();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (connected) return;
    const timer = setTimeout(() => setWaited(true), SHOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setWaited(false);
    };
  }, [connected]);

  if (connected || !waited) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200"
    >
      <WifiOff className="size-4 shrink-0" />
      <span>Connection lost. Reconnecting… Live messages and notifications are paused.</span>
    </div>
  );
}