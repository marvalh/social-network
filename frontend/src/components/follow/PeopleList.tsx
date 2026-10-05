'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/src/components/profile/Avatar';
import { FollowButton } from '@/src/components/follow/FollowButton';
import { ApiError, profileApi } from '@/src/services/api';
import type { FollowStatus } from '@/src/types/follow';
import type { User } from '@/src/types/user';

export function PeopleList() {
  const [users, setUsers] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<Record<string, FollowStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profileApi
      .suggestedUsers()
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Could not load suggestions.')
      )
      .finally(() => setLoading(false));
  }, []);

  function handleChange(userId: string, status: FollowStatus) {
    setStatuses((current) => ({ ...current, [userId]: status }));
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No suggestions right now.</p>;
  }

  return (
    <ul className="space-y-3">
      {users.map((user) => (
        <li key={user.userId} className="flex items-center gap-3">
          <Link href={`/profile/${user.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar user={user} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              {user.nickname && (
                <p className="truncate text-xs text-muted-foreground">@{user.nickname}</p>
              )}
            </div>
          </Link>
          <FollowButton
            userId={user.userId}
            name={`${user.firstName} ${user.lastName}`}
            isPublic={user.isPublic}
            status={statuses[user.userId] ?? 'none'}
            onChange={(status) => handleChange(user.userId, status)}
          />
        </li>
      ))}
    </ul>
  );
}