'use client';

import { cn } from 'cn';
import { mediaUrl } from '@/src/services/api';
import type { User } from '@/src/types/user';

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-28 w-28 text-2xl',
} as const;

interface AvatarProps {
  user: Pick<User, 'firstName' | 'lastName' | 'avatar'>;
  size?: keyof typeof sizes;
  className?: string;
}

export function initialsOf(user: Pick<User, 'firstName' | 'lastName'>) {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  const src = mediaUrl(user.avatar);

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/10 select-none',
        sizes[size],
        !src && 'gradient font-semibold text-white',
        className
      )}
    >
      {src ? (
        // Served by the Go backend behind a session cookie, so next/image's
        // optimizer can't fetch it — a plain <img> keeps the credentials.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${user.firstName} ${user.lastName}`}
          className="h-full w-full object-cover"
        />
      ) : (
        initialsOf(user)
      )}
    </span>
  );
}
