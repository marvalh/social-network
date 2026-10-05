'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLive } from '@/src/hooks/useLive';
import { ApiError, groupsApi } from '@/src/services/api';
import type { GroupInvite } from '@/src/types/group';

export function GroupInvitesList() {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    groupsApi
      .myInvites()
      .then((data) => setInvites(data.invites))
      .catch(() => {
        // keep what is on screen if a background refresh fails
      });
  }, []);

  useEffect(() => {
    groupsApi
      .myInvites()
      .then((data) => setInvites(data.invites))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load invites.'))
      .finally(() => setLoading(false));
  }, []);

  useLive('groups', reload);

  async function respond(inviteId: string, accept: boolean) {
    setBusyId(inviteId);
    try {
      await groupsApi.respondToInvite(inviteId, { accept });
      setInvites((current) => current.filter((inv) => inv.inviteId !== inviteId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (invites.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending group invites.</p>;
  }

  return (
    <ul className="space-y-2">
      {invites.map((invite) => (
        <li
          key={invite.inviteId}
          className="flex items-center justify-between rounded-lg border border-surface-border bg-surface px-3 py-2"
        >
          <Link
            href={`/groups/${invite.groupId}`}
            className="text-sm underline-offset-2 hover:underline"
          >
            View group →
          </Link>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busyId === invite.inviteId}
              onClick={() => respond(invite.inviteId, true)}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busyId === invite.inviteId}
              onClick={() => respond(invite.inviteId, false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}