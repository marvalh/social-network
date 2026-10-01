'use client';

import Link from 'next/link';
import { MessageCircle, Search } from 'lucide-react';
import { useAuth } from '@/src/context/Auth';
import { mediaUrl } from '@/src/utils/media';
import { NotificationBell } from './NotificationBell';

export function Topbar() {
  const { user } = useAuth();

  if (!user) return null;

  const avatarUrl = mediaUrl(user.avatar);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="gradient-text text-xl font-bold tracking-tight">
          social-network
        </Link>
        <div className="hidden max-w-sm flex-1 items-center rounded-lg border border-border bg-surface px-3 text-muted-foreground md:flex">
          <Search className="size-4" />
          <input
            className="w-full bg-transparent px-2 py-2 text-sm outline-none"
            placeholder="Search your network"
            aria-label="Search your network"
          />
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
