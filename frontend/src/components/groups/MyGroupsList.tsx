'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLive } from '@/src/hooks/useLive';
import { ApiError, groupsApi } from '@/src/services/api';
import type { GroupSummary } from '@/src/types/group';

export function MyGroupsList() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    groupsApi
      .mine()
      .then((data) => setGroups(data.groups))
      .catch(() => {
        // keep what is on screen if a background refresh fails
      });
  }, []);

  useEffect(() => {
    groupsApi
      .mine()
      .then((data) => setGroups(data.groups))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Could not load your groups.')
      )
      .finally(() => setLoading(false));
  }, []);

  useLive('groups', reload);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">You haven&apos;t joined any groups yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {groups.map((group) => (
        <li key={group.groupId}>
          <Link
            href={`/groups/${group.groupId}`}
            className="block rounded-lg border border-surface-border bg-surface px-3 py-2 hover:bg-muted"
          >
            <p className="truncate text-sm font-medium">{group.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}