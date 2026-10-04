'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/src/components/profile/Avatar';
import { profileApi } from '@/src/services/api';
import type { User } from '@/src/types/user';

interface UserChipProps {
  userId: string;
}

export function UserChip({ userId }: UserChipProps) {
  const [user, setUser] = useState<User | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .get(userId)
      .then((profile) => {
        if (!cancelled) setUser(profile.user);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (failed) {
    return <span className="text-sm text-muted-foreground">Unknown user</span>;
  }

  if (!user) {
    return <span className="text-sm text-muted-foreground">Loading…</span>;
  }

  return (
    <Link href={`/profile/${userId}`} className="flex items-center gap-3 hover:opacity-80">
      <Avatar user={user} size="sm" />
      <span className="text-sm text-foreground">
        {user.firstName} {user.lastName}
        {user.nickname && <span className="ml-1 text-muted-foreground">@{user.nickname}</span>}
      </span>
    </Link>
  );
}