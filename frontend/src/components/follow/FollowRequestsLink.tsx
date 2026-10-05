'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, UserCheck } from 'lucide-react';
import { useLive } from '@/src/hooks/useLive';
import { followApi } from '@/src/services/api';

export function FollowRequestsLink() {
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    followApi
      .pendingRequests()
      .then((pending) => setCount(pending.length))
      .catch(() => {
        // keep the last known count if a refresh fails
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLive('follow', load);

  return (
    <Link
      href="/follow"
      className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm font-medium ring-1 ring-white/10 hover:bg-muted"
    >
      <span className="flex items-center gap-2">
        <UserCheck className="size-4 text-brand-400" />
        Follow requests
        {count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pink-500 px-1.5 text-xs font-semibold text-white">
            {count}
          </span>
        )}
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}