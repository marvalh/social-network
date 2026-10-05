'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquarePlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/src/components/profile/Avatar';
import { chatApi } from '@/src/services/api';
import type { User } from '@/src/types/user';

export function NewMessage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<{ query: string; users: User[]; failed: boolean }>({
    query: '',
    users: [],
    failed: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const searching = trimmed !== '' && search.query !== trimmed;
  const results = search.query === trimmed ? search.users : [];
  const failed = search.query === trimmed && search.failed;

  useEffect(() => {
    if (trimmed === '') return;
    let cancelled = false;
    const timeout = setTimeout(() => {
      chatApi
        .searchUsersInChat(trimmed)
        .then((users) => {
          if (!cancelled) setSearch({ query: trimmed, users, failed: false });
        })
        .catch(() => {
          if (!cancelled) setSearch({ query: trimmed, users: [], failed: true });
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmed]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function toggle() {
    setOpen((current) => !current);
    setQuery('');
  }

  function start(person: User) {
    setOpen(false);
    setQuery('');
    router.push(`/messages/${person.userId}`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (results[0]) start(results[0]);
  }

  return (
    <div ref={containerRef} className="relative">
      <Button size="sm" onClick={toggle} aria-expanded={open}>
        <MessageSquarePlus className="size-4" />
        New message
      </Button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 shadow-2xl shadow-black/30">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people"
              aria-label="Search people to message"
              className="w-full bg-transparent py-2 text-sm text-foreground outline-none"
            />
          </form>

          <div className="mt-2 max-h-72 overflow-y-auto">
            {trimmed === '' ? (
              <p className="p-3 text-sm text-muted-foreground">
                Search for someone you follow or who follows you.
              </p>
            ) : searching ? (
              <p className="p-3 text-sm text-muted-foreground">Searching…</p>
            ) : failed ? (
              <p className="p-3 text-sm text-destructive">Could not search right now. Try again.</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No one found. You can message people you follow, or who follow you.
              </p>
            ) : (
              results.map((person) => (
                <button
                  key={person.userId}
                  type="button"
                  onClick={() => start(person)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
                >
                  <Avatar user={person} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {person.firstName} {person.lastName}
                    </p>
                    {person.nickname && (
                      <p className="truncate text-xs text-muted-foreground">@{person.nickname}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
