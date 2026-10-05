'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut, MessageCircle, UserPlus, UsersRound, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/Auth';
import { useUnread } from '@/src/context/Unread';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  /** Shows the unread messages count on this item. */
  showUnread?: boolean;
}

const isGroupChat = (p: string) => p.startsWith('/groups/') && p.endsWith('/chat');

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, isActive: (p) => p === '/' },
  {
    href: '/messages',
    label: 'Messages',
    icon: MessageCircle,
    isActive: (p) => p.startsWith('/messages') || isGroupChat(p),
    showUnread: true,
  },
  {
    href: '/groups',
    label: 'Groups',
    icon: UsersRound,
    isActive: (p) => p.startsWith('/groups') && !isGroupChat(p),
  },
  {
    href: '/people',
    label: 'People',
    icon: UserPlus,
    isActive: (p) => p.startsWith('/people') || p.startsWith('/follow'),
  },
];

function UnreadBadge({ count, className }: { count: number; className: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`grid place-items-center rounded-full bg-sky-500 font-semibold text-white ${className}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function Sidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const { summary } = useUnread();

  return (
    <>
      <aside className="hidden lg:block lg:w-60 lg:shrink-0 lg:py-6">
        <nav className="sticky top-24 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, isActive, showUnread }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                isActive(pathname)
                  ? 'bg-primary/10 font-medium text-brand-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="size-4" /> {label}
              {showUnread && (
                <UnreadBadge
                  count={summary.total}
                  className="ml-auto h-5 min-w-5 px-1.5 text-[11px]"
                />
              )}
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
            onClick={() => logout()}
          >
            <LogOut className="size-4" /> Log out
          </Button>
        </nav>
      </aside>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon, isActive, showUnread }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`flex h-14 flex-1 items-center justify-center ${
                active ? 'text-brand-400' : 'text-muted-foreground'
              }`}
            >
              <span className="relative">
                <Icon className="size-6" />
                {showUnread && (
                  <UnreadBadge
                    count={summary.total}
                    className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 text-[10px]"
                  />
                )}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="Log out"
          onClick={() => logout()}
          className="flex h-14 flex-1 items-center justify-center text-muted-foreground"
        >
          <LogOut className="size-6" />
        </button>
      </nav>
    </>
  );
}