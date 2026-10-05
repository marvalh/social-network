'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLive } from '@/src/hooks/useLive';
import { ApiError, groupsApi } from '@/src/services/api';
import type { GroupSummary } from '@/src/types/group';

export function GroupsList() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    groupsApi
      .browse()
      .then((data) => setGroups(data.groups))
      .catch(() => {
        // keep what is on screen if a background refresh fails
      });
  }, []);

  useEffect(() => {
    groupsApi
      .browse()
      .then((data) => setGroups(data.groups))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load groups.'))
      .finally(() => setLoading(false));
  }, []);

  useLive('groups', reload);

  async function toggleRequest(group: GroupSummary) {
    setBusyId(group.groupId);
    setError(null);
    try {
      if (group.hasRequested) {
        await groupsApi.cancelJoinRequest(group.groupId);
      } else {
        await groupsApi.requestToJoin(group.groupId);
      }
      setGroups((current) =>
        current.map((g) =>
          g.groupId === group.groupId ? { ...g, hasRequested: !group.hasRequested } : g
        )
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (groups.length === 0) {
    return (
      <>
        {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
        <p className="text-sm text-muted-foreground">No groups to join right now.</p>
      </>
    );
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <ul className="space-y-2">
        {groups.map((group) => (
          <li
            key={group.groupId}
            className="flex items-center justify-between rounded-lg border border-surface-border bg-surface px-3 py-2"
          >
            <Link href={`/groups/${group.groupId}`} className="min-w-0">
              <p className="truncate text-sm font-medium">{group.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
              </p>
            </Link>
            <Button
              size="sm"
              variant="secondary"
              disabled={busyId === group.groupId}
              onClick={() => toggleRequest(group)}
            >
              {group.hasRequested ? 'Cancel request' : 'Request to Join'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}