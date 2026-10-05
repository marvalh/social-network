'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/Auth';
import { ApiError, groupsApi } from '@/src/services/api';
import type { GroupInvite } from '@/src/types/group';
import { UserChip } from './UserChip';

interface PendingInvitesProps {
  invites: GroupInvite[];
  creatorId: string;
  onChanged: () => void;
}

export function PendingInvites({ invites, creatorId, onChanged }: PendingInvitesProps) {
  const { user } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (invites.length === 0) return null;

  async function cancel(inviteId: string) {
    setBusyId(inviteId);
    setError(null);
    try {
      await groupsApi.cancelInvite(inviteId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel that invite.');
    } finally {
      setBusyId(null);
      onChanged();
    }
  }

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
      <h3 className="text-sm font-semibold">Pending invites ({invites.length})</h3>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <ul className="mt-2 space-y-2">
        {invites.map((invite) => {
          const canCancel = user?.userId === invite.invitedBy || user?.userId === creatorId;
          return (
            <li
              key={invite.inviteId}
              className="flex items-center justify-between rounded-lg border border-surface-border bg-surface px-3 py-2"
            >
              <UserChip userId={invite.invitedTo} />
              {canCancel ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === invite.inviteId}
                  onClick={() => cancel(invite.inviteId)}
                >
                  Cancel
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
