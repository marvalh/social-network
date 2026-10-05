'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLive } from '@/src/hooks/useLive';
import { ApiError, followApi } from '@/src/services/api';
import type { PendingFollowRequest } from '@/src/services/follow';

export function FollowRequestsList() {
  const [requests, setRequests] = useState<PendingFollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    followApi
      .pendingRequests()
      .then(setRequests)
      .catch(() => {
        // keep what is on screen if a background refresh fails
      });
  }, []);

  useEffect(() => {
    followApi
      .pendingRequests()
      .then(setRequests)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load requests.'))
      .finally(() => setLoading(false));
  }, []);

  useLive('follow', reload);

  async function respond(requestId: string, action: 'accept' | 'decline') {
    setBusyId(requestId);
    try {
      if (action === 'accept') {
        await followApi.acceptRequest(requestId);
      } else {
        await followApi.declineRequest(requestId);
      }
      setRequests((current) => current.filter((r) => r.requestId !== requestId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending follow requests.</p>;
  }

  return (
    <ul className="space-y-2">
      {requests.map((req) => (
        <li
          key={req.requestId}
          className="flex items-center justify-between rounded-lg border border-surface-border bg-surface px-3 py-2"
        >
          <span className="text-sm">
            {req.user.firstName} {req.user.lastName}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busyId === req.requestId}
              onClick={() => respond(req.requestId, 'accept')}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busyId === req.requestId}
              onClick={() => respond(req.requestId, 'decline')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}