'use client';

import { useState } from 'react';
import { Check, Clock, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError, followApi } from '@/src/services/api';
import type { FollowStatus } from '@/src/types/user';

interface FollowButtonProps {
  userId: string;
  status: FollowStatus;
  onChange: (status: FollowStatus) => void;
}

export function FollowButton({ userId, status, onChange }: FollowButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'self') {
    return null;
  }

  async function run(action: () => Promise<FollowStatus>) {
    setBusy(true);
    setError(null);
    try {
      onChange(await action());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  const follow = () => run(() => followApi.follow(userId));
  const unfollow = () => run(() => followApi.unfollow(userId).then<FollowStatus>(() => 'none'));

  return (
    <div className="flex flex-col items-end gap-1">
      {status === 'none' && (
        <Button
          size="lg"
          disabled={busy}
          onClick={follow}
          className="gradient border-0 px-4 text-white shadow-lg shadow-purple-500/20"
        >
          <UserPlus className="h-4 w-4" />
          {busy ? 'Sending…' : 'Follow'}
        </Button>
      )}

      {status === 'pending' && (
        <Button size="lg" variant="secondary" disabled className="px-4">
          <Clock className="h-4 w-4" />
          Requested
        </Button>
      )}

      {status === 'accepted' && (
        <Button
          size="lg"
          variant="secondary"
          disabled={busy}
          onClick={unfollow}
          className="group px-4"
        >
          <Check className="h-4 w-4 group-hover:hidden" />
          <UserMinus className="hidden h-4 w-4 group-hover:block" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </Button>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
