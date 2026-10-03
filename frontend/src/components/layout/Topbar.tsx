'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Search } from 'lucide-react';
import { useAuth } from '@/src/context/Auth';
import { mediaUrl } from '@/src/utils/media';
import { profileApi } from '@/src/services/api';
import type { User } from '@/src/types/user';
import { NotificationBell } from './NotificationBell';

export function Topbar() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      profileApi
        .searchUsers(query.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const avatarUrl = mediaUrl(user.avatar);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="gradient-text text-xl font-bold tracking-tight">
          social-network
        </Link>

        <div ref={searchRef} className="relative hidden max-w-sm flex-1 md:block">
          <div className="flex items-center rounded-lg border border-border bg-surface px-3 text-muted-foreground">
            <Search className="size-4 shrink-0" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="w-full bg-transparent px-2 py-2 text-sm text-foreground outline-none"
              placeholder="Search your network"
              aria-label="Search your network"
            />
          </div>

          {open && query.trim() !== '' && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-surface-border bg-card shadow-lg">
              {loading && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
              {!loading && results.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No people found.</p>
              )}
              {!loading &&
                results.map((result) => (
                  <Link
                    key={result.userId}
                    href={`/profile/${result.userId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover"
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-brand-400">
                      {result.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {result.firstName} {result.lastName}
                      </p>
                      {result.nickname && (
                        <p className="truncate text-xs text-muted-foreground">@{result.nickname}</p>
                      )}
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>

        <nav className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <Link
            href="/messages"
            aria-label="Messages"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="size-4" />
          </Link>
          <Link href={`/profile/${user.userId}`} className="ml-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-8 rounded-full object-cover" />
            ) : (
              <div className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-brand-400">
                {user.firstName.charAt(0)}
              </div>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}