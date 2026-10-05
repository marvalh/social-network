'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/src/components/profile/Avatar';
import { useAuth } from '@/src/context/Auth';
import { ApiError, groupsApi, profileApi } from '@/src/services/api';
import type { User } from '@/src/types/user';

interface InviteUserProps {
  groupId: string;
  memberIds: string[];
}

export function InviteUser({ groupId, memberIds }: InviteUserProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<{ query: string; users: User[] }>({
    query: '',
    users: [],
  });
  const [open, setOpen] = useState(false);
  const [invited, setInvited] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const searching = trimmed !== '' && search.query !== trimmed;
  const results = (search.query === trimmed ? search.users : []).filter(
    (u) => u.userId !== user?.userId && !memberIds.includes(u.userId)
  );

  useEffect(() => {
    if (trimmed === '') return;
    let cancelled = false;
    const timeout = setTimeout(() => {
      profileApi
        .searchUsers(trimmed)
        .then((users) => {
          if (!cancelled) setSearch({ query: trimmed, users });
        })
        .catch(() => {
          if (!cancelled) setSearch({ query: trimmed, users: [] });
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmed]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function invite(target: User) {
    setBusyId(target.userId);
    setMessage(null);
    try {
      await groupsApi.sendInvite(groupId, { invitedTo: target.userId });
      setInvited((current) => [...current, target.userId]);
      setMessage({ ok: true, text: `Invite sent to ${target.firstName} ${target.lastName}.` });
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof ApiError ? err.message : 'Could not send the invite.',
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {message && (
        <p className={`mb-2 text-sm ${message.ok ? 'text-muted-foreground' : 'text-destructive'}`}>
          {message.text}
        </p>
      )}

      <div ref={containerRef} className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setMessage(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search people by name"
          aria-label="Search people to invite"
        />

        {open && trimmed !== '' && (
          <div className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            {searching && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
            {!searching && results.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No people found.</p>
            )}
            {!searching &&
              results.map((result) => {
                const done = invited.includes(result.userId);
                return (
                  <div
                    key={result.userId}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar user={result} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {result.firstName} {result.lastName}
                        </p>
                        {result.nickname && (
                          <p className="truncate text-xs text-muted-foreground">
                            @{result.nickname}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={done ? 'ghost' : 'secondary'}
                      disabled={done || busyId === result.userId}
                      onClick={() => invite(result)}
                    >
                      {done ? 'Invited' : 'Invite'}
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
