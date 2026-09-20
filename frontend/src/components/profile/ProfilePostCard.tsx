'use client';

import Link from 'next/link';
import { Globe, Lock, Users } from 'lucide-react';
import { mediaUrl } from '@/src/services/api';
import type { PostSummary, User } from '@/src/types/user';
import { Avatar } from './Avatar';

const privacyLabels = {
  public: { label: 'Public', icon: Globe },
  followers: { label: 'Followers', icon: Users },
  private: { label: 'Selected followers', icon: Lock },
} as const;

function timeAgo(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const seconds = Math.floor((Date.now() - then) / 1000);
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34, 'week'],
    [12, 'month'],
  ];

  let amount = seconds;
  let unit: Intl.RelativeTimeFormatUnit = 'second';
  for (const [size, nextUnit] of steps) {
    if (Math.abs(amount) < size) {
      break;
    }
    amount = Math.round(amount / size);
    unit = nextUnit;
  }
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-amount, unit);
}

interface ProfilePostCardProps {
  post: PostSummary;
  author: User;
}

export function ProfilePostCard({ post, author }: ProfilePostCardProps) {
  const privacy = privacyLabels[post.privacy] ?? privacyLabels.public;
  const PrivacyIcon = privacy.icon;
  const image = mediaUrl(post.img);

  return (
    <article className="rounded-2xl bg-card p-5 ring-1 ring-white/10 transition-colors hover:ring-white/20">
      <header className="flex items-center gap-3">
        <Avatar user={author} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {author.firstName} {author.lastName}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{timeAgo(post.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <PrivacyIcon className="h-3 w-3" />
            <span>{privacy.label}</span>
          </p>
        </div>
      </header>

      <Link href={`/posts/${post.postId}`} className="mt-3 block">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
          {post.content}
        </p>

        {image && (
          // Backend-served image behind a session cookie — see Avatar.tsx.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="mt-3 max-h-96 w-full rounded-xl object-cover ring-1 ring-white/10"
          />
        )}
      </Link>
    </article>
  );
}
