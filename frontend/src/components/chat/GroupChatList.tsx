'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { groupsApi } from '@/src/services/api';
import type { GroupSummary } from '@/src/types/group';

export function GroupChatList() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    groupsApi
      .mine()
      .then((res) => setGroups(res.groups))
      .catch(() => setError('Could not load your groups.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-destructive">{error}</p>;
  }

  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        You are not in any groups yet.{' '}
        <Link href="/groups" className="text-brand-400 hover:underline">
          Browse groups
        </Link>
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {groups.map((group) => (
        <li key={group.groupId}>
          <Link
            href={`/groups/${group.groupId}/chat`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-brand-400">
              <UsersRound className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{group.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}