'use client';

import Link from 'next/link';
import { AtSign } from 'lucide-react';
import { Avatar } from './Avatar';
import type { User } from '@/src/types/user';

interface UserListProps {
  users: User[];
  emptyMessage: string;
  /** Rendered on the right of each row (e.g. a "Remove" button). */
  action?: (user: User) => React.ReactNode;
}

export function UserList({ users, emptyMessage, action }: UserListProps) {
  if (users.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <ul className="divide-y divide-white/5">
      {users.map((user) => (
        <li key={user.userId} className="flex items-center gap-3 px-1 py-3">
          <Link
            href={`/profile/${user.userId}`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-white/[0.04]"
          >
            <Avatar user={user} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
              {user.nickname && (
                <span className="flex items-center gap-0.5 truncate text-xs text-muted-foreground">
                  <AtSign className="h-3 w-3" />
                  {user.nickname}
                </span>
              )}
            </span>
          </Link>
          {action?.(user)}
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
